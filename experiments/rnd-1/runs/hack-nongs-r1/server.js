const http = require('http');

const members = new Map();  // id -> { id, username }
const activities = [];       // { memberId, type, ts }
let nextMemberId = 1;

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) });
  res.end(json);
}

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/members') {
      const { username } = await parseBody(req);
      if (!username) return send(res, 400, { error: 'username required' });
      const member = { id: nextMemberId++, username };
      members.set(member.id, member);
      return send(res, 201, { member });
    }

    if (req.method === 'POST' && req.url === '/api/activity') {
      const { memberId, type } = await parseBody(req);
      if (!members.has(memberId)) return send(res, 404, { error: 'member not found' });
      if (!type) return send(res, 400, { error: 'type required' });
      activities.push({ memberId, type, ts: new Date().toISOString() });
      return send(res, 201, {});
    }

    if (req.method === 'GET' && req.url === '/api/admin/activity/dashboard') {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const byMember = new Map(); // memberId -> { lastAccess, actionsByType }

      for (const { memberId, type, ts } of activities) {
        if (!byMember.has(memberId)) byMember.set(memberId, { lastAccess: ts, actionsByType: {} });
        const entry = byMember.get(memberId);
        if (ts > entry.lastAccess) entry.lastAccess = ts;
        entry.actionsByType[type] = (entry.actionsByType[type] || 0) + 1;
      }

      const perMember = [];
      for (const [memberId, data] of byMember) {
        perMember.push({ memberId, lastAccess: data.lastAccess, actionsByType: data.actionsByType });
      }

      const activeMembers7d = [...byMember.values()].filter(e => e.lastAccess >= cutoff).length;

      return send(res, 200, { perMember, activeMembers7d });
    }

    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') console.log(`Listening on ${PORT}`);
});

module.exports = server;
