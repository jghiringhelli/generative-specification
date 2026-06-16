'use strict';

const express = require('express');
const app = express();
app.use(express.json());

const START_TIME = Date.now();

// ── In-memory store ──────────────────────────────────────────────────────────
let nextId = 1;
const members = new Map();   // id → { id, username, email, createdAt }
const activity = [];         // { id, memberId, type, createdAt }
let nextActId = 1;

// ── Helpers ──────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errBody(field, msg) {
  return { errors: { [field]: [msg] } };
}

function errFields(obj) {
  return { errors: obj };
}

function now() {
  return new Date().toISOString();
}

// ── R1 / R2 / R3 — POST /api/members ────────────────────────────────────────
app.post('/api/members', (req, res) => {
  const { username, email } = req.body || {};
  const errors = {};

  if (!username || String(username).trim() === '') {
    errors.username = ['is required'];
  }
  if (!email || !EMAIL_RE.test(String(email))) {
    errors.email = ['must be a valid email'];
  }

  if (Object.keys(errors).length) {
    return res.status(422).json(errFields(errors));
  }

  // R3 — duplicate username
  for (const m of members.values()) {
    if (m.username === username) {
      return res.status(409).json(errBody('username', 'already taken'));
    }
  }

  const member = { id: nextId++, username, email, createdAt: now() };
  members.set(member.id, member);
  return res.status(201).json({ member });
});

// ── R4 — GET /api/members ────────────────────────────────────────────────────
app.get('/api/members', (req, res) => {
  const limit  = Math.max(1, parseInt(req.query.limit  ?? '20', 10) || 20);
  const offset = Math.max(0, parseInt(req.query.offset ?? '0',  10) || 0);

  const all = Array.from(members.values());
  const page = all.slice(offset, offset + limit);
  return res.status(200).json({ members: page, total: all.length });
});

// ── R5 — GET /api/members/:id ────────────────────────────────────────────────
app.get('/api/members/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const member = members.get(id);
  if (!member) {
    return res.status(404).json(errBody('member', 'not found'));
  }
  return res.status(200).json({ member });
});

// ── R11 — DELETE /api/members/:id ───────────────────────────────────────────
app.delete('/api/members/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!members.has(id)) {
    return res.status(404).json(errBody('member', 'not found'));
  }
  members.delete(id);
  // cascade: remove activity for this member
  const keep = activity.filter(a => a.memberId !== id);
  activity.length = 0;
  activity.push(...keep);
  return res.status(204).send();
});

// ── R6 — POST /api/members/:id/activity ─────────────────────────────────────
app.post('/api/members/:id/activity', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!members.has(id)) {
    return res.status(404).json(errBody('member', 'not found'));
  }

  const { type } = req.body || {};
  if (!type || String(type).trim() === '') {
    return res.status(422).json(errBody('type', 'is required'));
  }

  const entry = { id: nextActId++, memberId: id, type: String(type), createdAt: now() };
  activity.push(entry);
  return res.status(201).json({ activity: entry });
});

// ── R7 / R12 — GET /api/admin/activity/dashboard ────────────────────────────
app.get('/api/admin/activity/dashboard', (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // R12: only activity from existing members
  const live = activity.filter(a => members.has(a.memberId));

  // Aggregate per member
  const byMember = new Map(); // memberId → { lastAccess: Date, actionsByType: {} }

  for (const a of live) {
    const ts = new Date(a.createdAt);
    if (!byMember.has(a.memberId)) {
      byMember.set(a.memberId, { lastAccess: ts, actionsByType: {} });
    }
    const agg = byMember.get(a.memberId);
    if (ts > agg.lastAccess) agg.lastAccess = ts;
    agg.actionsByType[a.type] = (agg.actionsByType[a.type] || 0) + 1;
  }

  const perMember = Array.from(byMember.entries()).map(([memberId, agg]) => ({
    memberId,
    lastAccess: agg.lastAccess.toISOString(),
    actionsByType: agg.actionsByType,
  }));

  // activeMembers7d: members with ≥1 action in the last 7 days (existing members only)
  const activeIds = new Set(
    live.filter(a => new Date(a.createdAt) >= sevenDaysAgo).map(a => a.memberId)
  );

  return res.status(200).json({ perMember, activeMembers7d: activeIds.size });
});

// ── R8 — GET /api/health ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptimeSeconds: (Date.now() - START_TIME) / 1000 });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Member Portal API listening on port ${PORT}`);
});

module.exports = app;
