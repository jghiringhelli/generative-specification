const http = require('http');
const PORT = process.env.PORT || 3000;

let members = {};   // id -> { id, username }
let activity = [];  // [{ memberId, type, ts }]
let nextId = 1;

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => buf += c);
    req.on('end', () => { try { resolve(JSON.parse(buf || '{}')); } catch(e) { resolve({}); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  const method = req.method;

  if (method === 'POST' && url === '/api/members') {
    const body = await readBody(req);
    if (!body.username) return json(res, 400, { error: 'username required' });
    const member = { id: nextId++, username: body.username };
    members[member.id] = member;
    return json(res, 201, { member });
  }

  if (method === 'POST' && url === '/api/activity') {
    const body = await readBody(req);
    if (!body.memberId || !body.type) return json(res, 400, { error: 'memberId and type required' });
    if (!members[body.memberId]) return json(res, 404, { error: 'member not found' });
    activity.push({ memberId: body.memberId, type: body.type, ts: new Date().toISOString() });
    return json(res, 201, { ok: true });
  }

  if (method === 'GET' && url === '/api/admin/activity/dashboard') {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const perMemberMap = {};

    for (const a of activity) {
      if (!perMemberMap[a.memberId]) {
        perMemberMap[a.memberId] = { memberId: a.memberId, lastAccess: a.ts, actionsByType: {} };
      }
      const entry = perMemberMap[a.memberId];
      if (a.ts > entry.lastAccess) entry.lastAccess = a.ts;
      entry.actionsByType[a.type] = (entry.actionsByType[a.type] || 0) + 1;
    }

    const perMember = Object.values(perMemberMap);
    const activeMembers7d = perMember.filter(e =>
      now - new Date(e.lastAccess).getTime() <= sevenDays
    ).length;

    return json(res, 200, { perMember, activeMembers7d });
  }

  json(res, 404, { error: 'not found' });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`listening on ${PORT}`));
}
module.exports = server;
