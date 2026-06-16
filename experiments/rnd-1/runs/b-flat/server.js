const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// In-memory store
let nextId = 1;
const members = {}; // id -> { id, username }
const activities = []; // { memberId, type, timestamp }

// POST /api/members
app.post('/api/members', (req, res) => {
  const { username } = req.body;
  const id = nextId++;
  members[id] = { id, username };
  res.status(201).json({ member: { id, username } });
});

// POST /api/activity
app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body;
  activities.push({ memberId, type, timestamp: new Date().toISOString() });
  res.status(201).json({});
});

// GET /api/admin/activity/dashboard
app.get('/api/admin/activity/dashboard', (req, res) => {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Aggregate per member
  const memberMap = {}; // memberId -> { lastAccess, actionsByType }

  for (const act of activities) {
    const { memberId, type, timestamp } = act;
    if (!memberMap[memberId]) {
      memberMap[memberId] = { lastAccess: timestamp, actionsByType: {} };
    }
    const entry = memberMap[memberId];
    // Track latest timestamp
    if (timestamp > entry.lastAccess) entry.lastAccess = timestamp;
    // Count by type (free string, no special treatment)
    entry.actionsByType[type] = (entry.actionsByType[type] || 0) + 1;
  }

  const perMember = Object.entries(memberMap).map(([memberId, data]) => ({
    memberId: Number(memberId),
    lastAccess: data.lastAccess,
    actionsByType: data.actionsByType,
  }));

  // activeMembers7d: members with >=1 action in last 7 days
  const activeSet = new Set();
  for (const act of activities) {
    if (new Date(act.timestamp).getTime() >= sevenDaysAgo) {
      activeSet.add(act.memberId);
    }
  }

  res.json({ perMember, activeMembers7d: activeSet.size });
});

app.listen(PORT, () => console.log(`b-flat listening on port ${PORT}`));
