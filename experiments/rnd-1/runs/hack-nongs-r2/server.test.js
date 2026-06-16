const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

let server;
let baseUrl;

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: server.address().port,
      path,
      method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 }
    };
    const r = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(buf) }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

before(async () => {
  server = require('./server');
  await new Promise(r => server.listen(0, r));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise(r => server.close(r));
});

test('POST /api/members returns 201 with member object', async () => {
  const res = await req('POST', '/api/members', { username: 'alice' });
  assert.equal(res.status, 201);
  assert.ok(res.body.member);
  assert.equal(res.body.member.username, 'alice');
  assert.ok(typeof res.body.member.id === 'number');
});

test('POST /api/members missing username returns 400', async () => {
  const res = await req('POST', '/api/members', {});
  assert.equal(res.status, 400);
});

test('POST /api/activity returns 201', async () => {
  const m = await req('POST', '/api/members', { username: 'bob' });
  const res = await req('POST', '/api/activity', { memberId: m.body.member.id, type: 'login' });
  assert.equal(res.status, 201);
});

test('POST /api/activity with unknown member returns 404', async () => {
  const res = await req('POST', '/api/activity', { memberId: 99999, type: 'login' });
  assert.equal(res.status, 404);
});

test('UC-1: dashboard aggregates actionsByType correctly', async () => {
  const m = await req('POST', '/api/members', { username: 'carol' });
  const mid = m.body.member.id;
  await req('POST', '/api/activity', { memberId: mid, type: 'post' });
  await req('POST', '/api/activity', { memberId: mid, type: 'post' });
  await req('POST', '/api/activity', { memberId: mid, type: 'comment' });

  const dash = await req('GET', '/api/admin/activity/dashboard', null);
  assert.equal(dash.status, 200);
  const entry = dash.body.perMember.find(e => e.memberId === mid);
  assert.ok(entry, 'member entry in dashboard');
  assert.equal(entry.actionsByType.post, 2);
  assert.equal(entry.actionsByType.comment, 1);
});

test('UC-1: lastAccess is ISO string of latest action', async () => {
  const m = await req('POST', '/api/members', { username: 'dave' });
  const mid = m.body.member.id;
  await req('POST', '/api/activity', { memberId: mid, type: 'login' });
  // small delay to ensure distinct timestamps
  await new Promise(r => setTimeout(r, 5));
  await req('POST', '/api/activity', { memberId: mid, type: 'post' });

  const dash = await req('GET', '/api/admin/activity/dashboard', null);
  const entry = dash.body.perMember.find(e => e.memberId === mid);
  assert.ok(entry.lastAccess, 'lastAccess present');
  assert.ok(!isNaN(Date.parse(entry.lastAccess)), 'lastAccess is valid ISO');
});

test('UC-2: activeMembers7d counts members with recent activity', async () => {
  const dash = await req('GET', '/api/admin/activity/dashboard', null);
  assert.equal(dash.status, 200);
  assert.ok(typeof dash.body.activeMembers7d === 'number');
  // all activity in tests was just created — all should be within 7d
  assert.ok(dash.body.activeMembers7d >= 1);
});

test('Acceptance: free-form type "share" aggregated without special treatment', async () => {
  const m = await req('POST', '/api/members', { username: 'eve' });
  const mid = m.body.member.id;
  await req('POST', '/api/activity', { memberId: mid, type: 'share' });
  await req('POST', '/api/activity', { memberId: mid, type: 'share' });
  await req('POST', '/api/activity', { memberId: mid, type: 'upvote' }); // another arbitrary type

  const dash = await req('GET', '/api/admin/activity/dashboard', null);
  const entry = dash.body.perMember.find(e => e.memberId === mid);
  assert.equal(entry.actionsByType.share, 2);
  assert.equal(entry.actionsByType.upvote, 1);
});

test('Dashboard shape has perMember array and activeMembers7d int', async () => {
  const dash = await req('GET', '/api/admin/activity/dashboard', null);
  assert.ok(Array.isArray(dash.body.perMember));
  assert.ok(Number.isInteger(dash.body.activeMembers7d));
});
