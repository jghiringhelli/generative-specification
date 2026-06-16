'use strict';

const express = require('express');

const app = express();
app.use(express.json());

const startTime = Date.now();

// In-memory stores
const members = new Map();   // id -> { id, username, email, createdAt }
const activity = new Map();  // memberId -> [ { type, timestamp } ]
let nextId = 1;

// R8 — health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptimeSeconds: (Date.now() - startTime) / 1000 });
});

// R1, R2, R3 — create member
app.post('/api/members', (req, res) => {
  const { username, email } = req.body || {};
  const errors = {};

  if (!username || String(username).trim() === '') {
    errors.username = ['username is required'];
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email).trim())) {
    errors.email = ['email is invalid'];
  }

  if (Object.keys(errors).length) {
    return res.status(422).json({ errors });
  }

  // R3 — duplicate username
  for (const m of members.values()) {
    if (m.username === String(username).trim()) {
      return res.status(409).json({ errors: { username: ['already taken'] } });
    }
  }

  const id = nextId++;
  const member = {
    id,
    username: String(username).trim(),
    email: String(email).trim(),
    createdAt: new Date().toISOString(),
  };
  members.set(id, member);
  activity.set(id, []);

  return res.status(201).json({ member });
});

// R4 — list members
app.get('/api/members', (req, res) => {
  const limit  = Math.max(1, parseInt(req.query.limit  ?? '20', 10) || 20);
  const offset = Math.max(0, parseInt(req.query.offset ?? '0',  10) || 0);

  const all = Array.from(members.values());
  const page = all.slice(offset, offset + limit);

  return res.json({ members: page, total: all.length });
});

// R5 — get member by id
app.get('/api/members/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const member = members.get(id);
  if (!member) {
    return res.status(404).json({ errors: { member: ['not found'] } });
  }
  return res.json({ member });
});

// R11 — delete member (cascade activity)
app.delete('/api/members/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!members.has(id)) {
    return res.status(404).json({ errors: { member: ['not found'] } });
  }
  members.delete(id);
  activity.delete(id);   // cascade R11, R12
  return res.status(204).send();
});

// R6 — record activity
app.post('/api/members/:id/activity', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!members.has(id)) {
    return res.status(404).json({ errors: { member: ['not found'] } });
  }

  const { type } = req.body || {};
  if (!type || String(type).trim() === '') {
    return res.status(422).json({ errors: { type: ['type is required'] } });
  }

  activity.get(id).push({ type: String(type).trim(), timestamp: new Date().toISOString() });
  return res.status(201).send();
});

// R7 — dashboard
app.get('/api/admin/activity/dashboard', (req, res) => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let activeMembers7d = 0;

  // R12 — only existing members
  const perMember = Array.from(members.keys()).map(memberId => {
    const acts = activity.get(memberId) || [];

    const actionsByType = {};
    let lastAccess = null;
    let activeInWindow = false;

    for (const a of acts) {
      actionsByType[a.type] = (actionsByType[a.type] || 0) + 1;
      if (!lastAccess || a.timestamp > lastAccess) lastAccess = a.timestamp;
      if (new Date(a.timestamp) >= cutoff) activeInWindow = true;
    }

    if (activeInWindow) activeMembers7d++;

    return { memberId, lastAccess, actionsByType };
  });

  return res.json({ perMember, activeMembers7d });
});

// R9 — catch-all 404 with consistent error shape
app.use((req, res) => {
  res.status(404).json({ errors: { route: ['not found'] } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Member Portal API listening on port ${PORT}`);
});
