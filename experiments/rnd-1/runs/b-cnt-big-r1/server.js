'use strict';

const http = require('http');
const express = require('express');

const app = express();
app.use(express.json());

// ── In-memory store ──────────────────────────────────────────────────────────
let members = [];          // { id, username, email, createdAt }
let activities = [];       // { id, memberId, type, createdAt }
let nextMemberId = 1;
let nextActivityId = 1;
const startTime = Date.now();

// ── Helpers ──────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function iso() {
  return new Date().toISOString();
}

// ── R1/R2/R3 — POST /api/members ────────────────────────────────────────────
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
    return res.status(422).json({ errors });
  }

  // R3 — duplicate username
  if (members.find(m => m.username === username)) {
    return res.status(409).json({ errors: { username: ['already taken'] } });
  }

  const member = {
    id: nextMemberId++,
    username: String(username).trim(),
    email: String(email).trim(),
    createdAt: iso(),
  };
  members.push(member);
  return res.status(201).json({ member });
});

// ── R4 — GET /api/members ────────────────────────────────────────────────────
app.get('/api/members', (req, res) => {
  const limit  = Math.max(1, parseInt(req.query.limit,  10) || 20);
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const page   = members.slice(offset, offset + limit);
  return res.status(200).json({ members: page, total: members.length });
});

// ── R5 — GET /api/members/:id ────────────────────────────────────────────────
app.get('/api/members/:id', (req, res) => {
  const member = members.find(m => m.id === parseInt(req.params.id, 10));
  if (!member) {
    return res.status(404).json({ errors: { member: ['not found'] } });
  }
  return res.status(200).json({ member });
});

// ── R11 — DELETE /api/members/:id ───────────────────────────────────────────
app.delete('/api/members/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ errors: { member: ['not found'] } });
  }
  members.splice(idx, 1);
  // cascade — R11 + R12
  activities = activities.filter(a => a.memberId !== id);
  return res.status(204).send();
});

// ── R6 — POST /api/members/:id/activity ────────────────────────────────────
app.post('/api/members/:id/activity', (req, res) => {
  const memberId = parseInt(req.params.id, 10);
  const member   = members.find(m => m.id === memberId);
  if (!member) {
    return res.status(404).json({ errors: { member: ['not found'] } });
  }

  const { type } = req.body || {};
  if (!type || String(type).trim() === '') {
    return res.status(422).json({ errors: { type: ['is required'] } });
  }

  const activity = {
    id: nextActivityId++,
    memberId,
    type: String(type).trim(),
    createdAt: iso(),
  };
  activities.push(activity);
  return res.status(201).json({ activity });
});

// ── R7/R12 — GET /api/admin/activity/dashboard ──────────────────────────────
app.get('/api/admin/activity/dashboard', (req, res) => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Only existing members (R12 — deleted members already cascade-removed from activities)
  const existingIds = new Set(members.map(m => m.id));

  // Group by memberId
  const byMember = {};
  for (const act of activities) {
    if (!existingIds.has(act.memberId)) continue; // extra guard (shouldn't be needed post-cascade)
    if (!byMember[act.memberId]) {
      byMember[act.memberId] = { lastAccess: act.createdAt, actionsByType: {} };
    }
    const entry = byMember[act.memberId];
    // lastAccess = most recent
    if (act.createdAt > entry.lastAccess) entry.lastAccess = act.createdAt;
    entry.actionsByType[act.type] = (entry.actionsByType[act.type] || 0) + 1;
  }

  const perMember = Object.entries(byMember).map(([memberId, data]) => ({
    memberId: parseInt(memberId, 10),
    lastAccess: data.lastAccess,
    actionsByType: data.actionsByType,
  }));

  // activeMembers7d — members with ≥1 action in last 7 days (R7)
  const activeSet = new Set();
  for (const act of activities) {
    if (existingIds.has(act.memberId) && new Date(act.createdAt) >= cutoff) {
      activeSet.add(act.memberId);
    }
  }

  return res.status(200).json({ perMember, activeMembers7d: activeSet.size });
});

// ── R8 — GET /api/health ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
    uptimeSeconds: (Date.now() - startTime) / 1000,
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Member Portal API listening on port ${PORT}`);
});
