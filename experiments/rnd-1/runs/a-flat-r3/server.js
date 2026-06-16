const express = require('express');

const app = express();
app.use(express.json());

// --- In-memory store ---
const members = {};   // memberId (int) -> { id, username, createdAt }
const activity = [];  // [{ id, memberId, type, timestamp }]
let nextMemberId = 1;
let nextActivityId = 1;

// POST /api/members
app.post('/api/members', (req, res) => {
  const { username } = req.body || {};
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username is required' });
  }
  const id = nextMemberId++;
  members[id] = { id, username, createdAt: new Date().toISOString() };
  res.status(201).json({ id });
});

// POST /api/activity
app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body || {};
  if (memberId == null || !type || typeof type !== 'string') {
    return res.status(400).json({ error: 'memberId and type are required' });
  }
  if (!members[memberId]) {
    return res.status(404).json({ error: 'member not found' });
  }
  const entry = {
    id: nextActivityId++,
    memberId: Number(memberId),
    type,
    timestamp: new Date().toISOString(),
  };
  activity.push(entry);
  res.status(201).json({ id: entry.id });
});

// GET /api/admin/activity/dashboard
app.get('/api/admin/activity/dashboard', (_req, res) => {
  const lastAccess = {};   // memberId -> ISO string
  const actionCount = {};  // memberId -> number

  for (const e of activity) {
    const mid = e.memberId;
    if (!lastAccess[mid] || e.timestamp > lastAccess[mid]) {
      lastAccess[mid] = e.timestamp;
    }
    actionCount[mid] = (actionCount[mid] || 0) + 1;
  }

  const memberSummary = Object.values(members).map((m) => ({
    id: m.id,
    username: m.username,
    lastAccess: lastAccess[m.id] ?? null,
    totalActions: actionCount[m.id] ?? 0,
  }));

  // 20 most-recent events, newest first
  const recentActivity = activity.slice(-20).reverse().map((e) => ({
    id: e.id,
    memberId: e.memberId,
    username: members[e.memberId]?.username ?? null,
    type: e.type,
    timestamp: e.timestamp,
  }));

  res.json({
    totalMembers: Object.keys(members).length,
    totalActions: activity.length,
    memberSummary,
    recentActivity,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
