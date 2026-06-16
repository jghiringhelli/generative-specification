const express = require('express');
const app = express();
app.use(express.json());

let memberIdSeq = 1;
const members = new Map(); // id -> { id, username }
const activity = [];      // [{ memberId, type, ts }]

app.post('/api/members', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  const member = { id: memberIdSeq++, username };
  members.set(member.id, member);
  res.status(201).json({ member });
});

app.post('/api/activity', (req, res) => {
  const { memberId, type } = req.body;
  if (!memberId || !type) return res.status(400).json({ error: 'memberId and type required' });
  if (!members.has(memberId)) return res.status(404).json({ error: 'member not found' });
  activity.push({ memberId, type, ts: new Date().toISOString() });
  res.status(201).json({ ok: true });
});

app.get('/api/admin/activity/dashboard', (req, res) => {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Build per-member aggregates
  const agg = new Map(); // memberId -> { lastAccess, actionsByType }
  for (const { memberId, type, ts } of activity) {
    if (!agg.has(memberId)) agg.set(memberId, { lastAccess: ts, actionsByType: {} });
    const entry = agg.get(memberId);
    if (ts > entry.lastAccess) entry.lastAccess = ts;
    entry.actionsByType[type] = (entry.actionsByType[type] || 0) + 1;
  }

  const perMember = [];
  for (const [memberId, { lastAccess, actionsByType }] of agg) {
    perMember.push({ memberId, lastAccess, actionsByType });
  }

  const activeMembers7d = [...agg.entries()].filter(
    ([, { lastAccess }]) => new Date(lastAccess).getTime() >= sevenDaysAgo
  ).length;

  res.json({ perMember, activeMembers7d });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
