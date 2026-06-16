const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// In-memory store
let nextMemberId = 1;
const members = {};   // id -> { id, username }
const activity = []; // { memberId, type, timestamp }

// POST /api/members
app.post('/api/members', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  const member = { id: nextMemberId++, username };
  members[member.id] = member;
  res.status(201).json({ member });
});

// POST /api/activity
app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body;
  if (!memberId || !type) return res.status(400).json({ error: 'memberId and type required' });
  if (!members[memberId]) return res.status(404).json({ error: 'member not found' });
  activity.push({ memberId, type, timestamp: new Date().toISOString() });
  res.status(201).json({});
});

// GET /api/admin/activity/dashboard
app.get('/api/admin/activity/dashboard', (req, res) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Aggregate per member
  const agg = {}; // memberId -> { lastAccess, actionsByType }
  for (const entry of activity) {
    const { memberId, type, timestamp } = entry;
    if (!agg[memberId]) {
      agg[memberId] = { lastAccess: timestamp, actionsByType: {} };
    }
    const m = agg[memberId];
    if (timestamp > m.lastAccess) m.lastAccess = timestamp;
    m.actionsByType[type] = (m.actionsByType[type] || 0) + 1;
  }

  const perMember = Object.entries(agg).map(([id, data]) => ({
    memberId: Number(id),
    lastAccess: data.lastAccess,
    actionsByType: data.actionsByType,
  }));

  // Active members: ≥1 action in last 7 days
  const activeSet = new Set(
    activity
      .filter(e => new Date(e.timestamp) >= cutoff)
      .map(e => e.memberId)
  );
  const activeMembers7d = activeSet.size;

  res.status(200).json({ perMember, activeMembers7d });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
