'use strict';
const express = require('express');
const app = express();
app.use(express.json());

// In-memory store
const members = new Map();   // id -> { id, username }
const activity = [];         // [{ memberId, type, ts }]
let nextId = 1;

// POST /api/members
app.post('/api/members', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required' });
  const member = { id: nextId++, username };
  members.set(member.id, member);
  return res.status(201).json({ member });
});

// POST /api/activity
app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body || {};
  if (!memberId || !type) return res.status(400).json({ error: 'memberId and type required' });
  if (!members.has(memberId)) return res.status(404).json({ error: 'member not found' });
  activity.push({ memberId, type, ts: new Date().toISOString() });
  return res.status(201).json({ ok: true });
});

// GET /api/admin/activity/dashboard
app.get('/api/admin/activity/dashboard', (req, res) => {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Aggregate per member
  const agg = new Map(); // memberId -> { lastAccess: Date, actionsByType: {} }
  for (const { memberId, type, ts } of activity) {
    if (!agg.has(memberId)) agg.set(memberId, { lastTs: ts, actionsByType: {} });
    const entry = agg.get(memberId);
    if (ts > entry.lastTs) entry.lastTs = ts;
    entry.actionsByType[type] = (entry.actionsByType[type] || 0) + 1;
  }

  const perMember = [];
  let activeMembers7d = 0;

  for (const [memberId, { lastTs, actionsByType }] of agg) {
    perMember.push({ memberId, lastAccess: lastTs, actionsByType });
    if (now - new Date(lastTs).getTime() <= sevenDaysMs) activeMembers7d++;
  }

  // Include members with no activity (omit from perMember but don't count as active)
  return res.status(200).json({ perMember, activeMembers7d });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
