const express = require('express');
const app = express();
app.use(express.json());

const members = new Map(); // id -> { id, username }
const activities = [];     // { memberId, type, ts }
let nextId = 1;

app.post('/api/members', (req, res) => {
  const { username } = req.body;
  const member = { id: nextId++, username };
  members.set(member.id, member);
  res.status(201).json({ member });
});

app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body;
  activities.push({ memberId, type, ts: new Date().toISOString() });
  res.status(201).json({});
});

app.get('/api/admin/activity/dashboard', (req, res) => {
  const now = Date.now();
  const seven = 7 * 24 * 60 * 60 * 1000;

  // aggregate per member
  const agg = new Map(); // memberId -> { lastAccess, actionsByType }

  for (const { memberId, type, ts } of activities) {
    if (!agg.has(memberId)) {
      agg.set(memberId, { lastAccess: ts, actionsByType: {} });
    }
    const entry = agg.get(memberId);
    if (ts > entry.lastAccess) entry.lastAccess = ts;
    entry.actionsByType[type] = (entry.actionsByType[type] || 0) + 1;
  }

  const perMember = [];
  for (const [memberId, { lastAccess, actionsByType }] of agg) {
    perMember.push({ memberId, lastAccess, actionsByType });
  }

  const activeMembers7d = [...agg.entries()].filter(([, { lastAccess }]) =>
    now - new Date(lastAccess).getTime() <= seven
  ).length;

  res.json({ perMember, activeMembers7d });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
