const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.PORT = '0';

const server = require('./server');

let baseUrl;

before(() => new Promise(resolve => {
  if (server.listening) {
    baseUrl = `http://localhost:${server.address().port}`;
    return resolve();
  }
  server.once('listening', () => {
    baseUrl = `http://localhost:${server.address().port}`;
    resolve();
  });
}));

after(() => new Promise(resolve => server.close(resolve)));

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${baseUrl}${path}`, opts);
  const json = await res.json();
  return { status: res.status, body: json };
}

test('POST /api/members returns 201 with member', async () => {
  const r = await req('POST', '/api/members', { username: 'alice' });
  assert.equal(r.status, 201);
  assert.ok(r.body.member);
  assert.equal(r.body.member.username, 'alice');
  assert.ok(typeof r.body.member.id === 'number');
});

test('POST /api/activity returns 201', async () => {
  const m = await req('POST', '/api/members', { username: 'bob' });
  const r = await req('POST', '/api/activity', { memberId: m.body.member.id, type: 'login' });
  assert.equal(r.status, 201);
});

test('GET /api/admin/activity/dashboard — shape correcta', async () => {
  const r = await req('GET', '/api/admin/activity/dashboard');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.perMember));
  assert.ok(typeof r.body.activeMembers7d === 'number');
});

test('UC-1: actionsByType agrega conteos (no filas crudas)', async () => {
  const m = await req('POST', '/api/members', { username: 'carol' });
  const id = m.body.member.id;
  await req('POST', '/api/activity', { memberId: id, type: 'post' });
  await req('POST', '/api/activity', { memberId: id, type: 'post' });
  await req('POST', '/api/activity', { memberId: id, type: 'login' });

  const dash = await req('GET', '/api/admin/activity/dashboard');
  const entry = dash.body.perMember.find(e => e.memberId === id);
  assert.ok(entry, 'member debe aparecer en perMember');
  assert.equal(entry.actionsByType.post, 2, 'post debe contar 2');
  assert.equal(entry.actionsByType.login, 1, 'login debe contar 1');
});

test('UC-1: lastAccess es el ISO del ultimo evento', async () => {
  const m = await req('POST', '/api/members', { username: 'dave' });
  const id = m.body.member.id;
  await req('POST', '/api/activity', { memberId: id, type: 'login' });
  // small delay so second ts is strictly greater
  await new Promise(r => setTimeout(r, 5));
  await req('POST', '/api/activity', { memberId: id, type: 'post' });

  const dash = await req('GET', '/api/admin/activity/dashboard');
  const entry = dash.body.perMember.find(e => e.memberId === id);
  assert.ok(entry, 'member debe aparecer');
  // lastAccess must be a valid ISO string
  assert.ok(!isNaN(Date.parse(entry.lastAccess)), 'lastAccess debe ser ISO valido');
});

test('Criterio: type fuera de lista ilustrativa (share) se agrega sin tratamiento especial', async () => {
  const m = await req('POST', '/api/members', { username: 'eve' });
  const id = m.body.member.id;
  await req('POST', '/api/activity', { memberId: id, type: 'share' });
  await req('POST', '/api/activity', { memberId: id, type: 'share' });

  const dash = await req('GET', '/api/admin/activity/dashboard');
  const entry = dash.body.perMember.find(e => e.memberId === id);
  assert.ok(entry);
  assert.equal(entry.actionsByType.share, 2, 'share debe contar 2');
});

test('UC-2: activeMembers7d cuenta miembros con >=1 accion reciente', async () => {
  const dash = await req('GET', '/api/admin/activity/dashboard');
  // todos los miembros creados en este test tienen actividad reciente
  assert.ok(dash.body.activeMembers7d >= 1);
});

test('POST /api/activity con memberId inexistente retorna 404', async () => {
  const r = await req('POST', '/api/activity', { memberId: 99999, type: 'login' });
  assert.equal(r.status, 404);
});
