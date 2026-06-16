'use strict';

const express = require('express');
const app = express();
app.use(express.json());

// In-memory store
const members = new Map();   // id -> { id, username }
const activity = [];          // [{ memberId, type, ts }]
let nextMemberId = 1;

// POST /api/members
app.post('/api/members', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required' });
  const member = { id: nextMemberId++, username };
  members.set(member.id, member);
  res.status(201).json({ member });
});

// POST /api/activity
app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body || {};
  if (!memberId || !type) return res.status(400).json({ error: 'memberId and type required' });
  if (!members.has(memberId)) return res.status(404).json({ error: 'member not found' });
  activity.push({ memberId, type, ts: new Date().toISOString() });
  res.status(201).json({});
});

// GET /api/admin/activity/dashboard
app.get('/api/admin/activity/dashboard', (req, res) => {
  const now = Date.now();
  const ms7d = 7 * 24 * 60 * 60 * 1000;

  // Aggregate per member
  const memberMap = new Map(); // memberId -> { lastAccess, actionsByType }

  for (const { memberId, type, ts } of activity) {
    if (!memberMap.has(memberId)) {
      memberMap.set(memberId, { lastAccess: ts, actionsByType: {} });
    }
    const entry = memberMap.get(memberId);
    // Track latest timestamp
    if (ts > entry.lastAccess) entry.lastAccess = ts;
    // Count by type — any free-string type, no special casing
    entry.actionsByType[type] = (entry.actionsByType[type] || 0) + 1;
  }

  const perMember = [];
  let activeMembers7d = 0;

  for (const [memberId, { lastAccess, actionsByType }] of memberMap) {
    perMember.push({ memberId, lastAccess, actionsByType });
    if (now - new Date(lastAccess).getTime() <= ms7d) activeMembers7d++;
  }

  res.json({ perMember, activeMembers7d });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
