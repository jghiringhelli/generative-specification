'use strict';

const express = require('express');
const app = express();
app.use(express.json());

const START = Date.now();

// --- In-memory store ---
let nextId = 1;
const members = new Map();   // id -> { id, username, email, createdAt }
const activity = new Map();  // memberId -> [{ type, ts }]

// --- Helpers ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldErrors(body) {
  const errs = {};
  if (!body.username || String(body.username).trim() === '') {
    errs.username = ['username is required'];
  }
  if (!body.email || !EMAIL_RE.test(String(body.email))) {
    errs.email = ['must be a valid email'];
  }
  return Object.keys(errs).length ? errs : null;
}

function memberById(id) {
  return members.get(Number(id)) || null;
}

// --- R1 / R2 / R3  POST /api/members ---
app.post('/api/members', (req, res) => {
  const errs = fieldErrors(req.body);
  if (errs) return res.status(422).json({ errors: errs });

  const username = String(req.body.username).trim();
  const email = String(req.body.email).trim();

  for (const m of members.values()) {
    if (m.username === username) {
      return res.status(409).json({ errors: { username: ['already taken'] } });
    }
  }

  const member = { id: nextId++, username, email, createdAt: new Date().toISOString() };
  members.set(member.id, member);
  activity.set(member.id, []);
  return res.status(201).json({ member });
});

// --- R4  GET /api/members?limit=&offset= ---
app.get('/api/members', (req, res) => {
  const limit  = Math.max(0, parseInt(req.query.limit,  10) || 20);
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const all = Array.from(members.values());
  return res.json({ members: all.slice(offset, offset + limit), total: all.length });
});

// --- R5  GET /api/members/:id ---
app.get('/api/members/:id', (req, res) => {
  const m = memberById(req.params.id);
  if (!m) return res.status(404).json({ errors: { member: ['not found'] } });
  return res.json({ member: m });
});

// --- R6  POST /api/members/:id/activity ---
app.post('/api/members/:id/activity', (req, res) => {
  const m = memberById(req.params.id);
  if (!m) return res.status(404).json({ errors: { member: ['not found'] } });

  const type = req.body && req.body.type;
  if (!type || String(type).trim() === '') {
    return res.status(422).json({ errors: { type: ['type is required'] } });
  }

  activity.get(m.id).push({ type: String(type).trim(), ts: new Date().toISOString() });
  return res.status(201).json({});
});

// --- R7  GET /api/admin/activity/dashboard ---
app.get('/api/admin/activity/dashboard', (req, res) => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const perMember = [];
  let activeMembers7d = 0;

  for (const [memberId, events] of activity.entries()) {
    // R12: skip deleted members
    if (!members.has(memberId)) continue;

    const actionsByType = {};
    let lastAccess = null;
    let active7d = false;

    for (const ev of events) {
      actionsByType[ev.type] = (actionsByType[ev.type] || 0) + 1;
      if (!lastAccess || ev.ts > lastAccess) lastAccess = ev.ts;
      if (ev.ts >= cutoff) active7d = true;
    }

    if (lastAccess !== null) {
      perMember.push({ memberId, lastAccess, actionsByType });
    }
    if (active7d) activeMembers7d++;
  }

  return res.json({ perMember, activeMembers7d });
});

// --- R8  GET /api/health ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptimeSeconds: (Date.now() - START) / 1000 });
});

// --- R11  DELETE /api/members/:id ---
app.delete('/api/members/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!members.has(id)) return res.status(404).json({ errors: { member: ['not found'] } });
  members.delete(id);
  activity.delete(id);   // cascade — R12 satisfied
  return res.status(204).send();
});

// --- Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Member Portal API listening on port ${PORT}`));
