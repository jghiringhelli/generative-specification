const express = require('express');
const app = express();
app.use(express.json());

const members = {};   // id -> { id, username, createdAt }
const activity = []; // [{ id, memberId, type, timestamp }]
let nextMemberId = 1;
let nextActivityId = 1;

// POST /api/members
app.post('/api/members', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  const id = nextMemberId++;
  members[id] = { id, username, createdAt: new Date().toISOString() };
  res.status(201).json({ id });
});

// POST /api/activity
app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body;
  if (!memberId || !type) return res.status(400).json({ error: 'memberId and type required' });
  if (!members[memberId]) return res.status(404).json({ error: 'member not found' });
  const entry = { id: nextActivityId++, memberId, type, timestamp: new Date().toISOString() };
  activity.push(entry);
  res.status(201).json({ id: entry.id });
});

// GET /api/admin/activity/dashboard
app.get('/api/admin/activity/dashboard', (req, res) => {
  // Last access per member (last activity timestamp)
  const lastAccess = {};
  const actionCounts = {};

  for (const e of activity) {
    if (!lastAccess[e.memberId] || e.timestamp > lastAccess[e.memberId]) {
      lastAccess[e.memberId] = e.timestamp;
    }
    actionCounts[e.memberId] = (actionCounts[e.memberId] || 0) + 1;
  }

  const recentActivity = activity.slice(-20).reverse();

  const memberSummary = Object.values(members).map(m => ({
    id: m.id,
    username: m.username,
    lastAccess: lastAccess[m.id] || null,
    totalActions: actionCounts[m.id] || 0,
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
