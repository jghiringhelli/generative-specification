const express = require('express');
const app = express();
app.use(express.json());

// In-memory store
const members = new Map();   // id -> { id, username, createdAt }
const activities = [];        // [{ id, memberId, type, timestamp }]
let memberSeq = 1;
let activitySeq = 1;

// POST /api/members
app.post('/api/members', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  const id = memberSeq++;
  members.set(id, { id, username, createdAt: new Date().toISOString() });
  res.status(201).json({ id });
});

// POST /api/activity
app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body;
  if (!memberId || !type) return res.status(400).json({ error: 'memberId and type required' });
  if (!members.has(memberId)) return res.status(404).json({ error: 'member not found' });
  const record = { id: activitySeq++, memberId, type, timestamp: new Date().toISOString() };
  activities.push(record);
  res.status(201).json({ id: record.id });
});

// GET /api/admin/activity/dashboard
app.get('/api/admin/activity/dashboard', (req, res) => {
  // Last access per member = last activity timestamp
  const lastAccess = new Map();
  const activityCount = new Map();

  for (const a of activities) {
    const prev = lastAccess.get(a.memberId);
    if (!prev || a.timestamp > prev) lastAccess.set(a.memberId, a.timestamp);
    activityCount.set(a.memberId, (activityCount.get(a.memberId) || 0) + 1);
  }

  const recentActivities = [...activities]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 20)
    .map(a => ({
      activityId: a.id,
      memberId: a.memberId,
      username: members.get(a.memberId)?.username,
      type: a.type,
      timestamp: a.timestamp,
    }));

  const memberSummary = [...members.values()].map(m => ({
    id: m.id,
    username: m.username,
    createdAt: m.createdAt,
    lastAccess: lastAccess.get(m.id) || null,
    totalActions: activityCount.get(m.id) || 0,
  }));

  res.json({
    totalMembers: members.size,
    totalActivities: activities.length,
    memberSummary,
    recentActivities,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
