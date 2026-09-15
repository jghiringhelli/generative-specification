import request from 'supertest';
import { buildTestHarness } from '../support/testApp';
import { authHeader } from '../support/apiHelpers';

describe('Auth endpoints', () => {
  it('POST /api/users registers a user (201)', async () => {
    const { app } = buildTestHarness();
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: 'jake', email: 'jake@example.com', password: 'pw12345' } });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('jake');
    expect(res.body.user.token).toBeDefined();
  });

  it('POST /api/users rejects invalid email (422)', async () => {
    const { app } = buildTestHarness();
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: 'x', email: 'not-an-email', password: 'pw' } });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/users rejects a duplicate email (409)', async () => {
    const { app } = buildTestHarness();
    const user = { username: 'a', email: 'dup@example.com', password: 'pw' };
    await request(app).post('/api/users').send({ user });
    const res = await request(app)
      .post('/api/users')
      .send({ user: { ...user, username: 'b' } });

    expect(res.status).toBe(409);
    expect(res.body.errors.body).toBeDefined();
  });

  it('POST /api/users/login authenticates (200)', async () => {
    const { app } = buildTestHarness();
    await request(app)
      .post('/api/users')
      .send({ user: { username: 'log', email: 'log@example.com', password: 'pw12345' } });

    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'log@example.com', password: 'pw12345' } });

    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
  });

  it('POST /api/users/login rejects bad credentials (401)', async () => {
    const { app } = buildTestHarness();
    await request(app)
      .post('/api/users')
      .send({ user: { username: 'log', email: 'log@example.com', password: 'right' } });

    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'log@example.com', password: 'wrong' } });

    expect(res.status).toBe(401);
  });

  it('GET /api/user requires authentication (401)', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });

  it('GET /api/user returns the current user when authenticated (200)', async () => {
    const { app } = buildTestHarness();
    const reg = await request(app)
      .post('/api/users')
      .send({ user: { username: 'me', email: 'me@example.com', password: 'pw12345' } });
    const token = reg.body.user.token;

    const res = await request(app).get('/api/user').set('Authorization', authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
  });

  it('PUT /api/user updates the current user (200)', async () => {
    const { app } = buildTestHarness();
    const reg = await request(app)
      .post('/api/users')
      .send({ user: { username: 'upd', email: 'upd@example.com', password: 'pw12345' } });
    const token = reg.body.user.token;

    const res = await request(app)
      .put('/api/user')
      .set('Authorization', authHeader(token))
      .send({ user: { bio: 'my bio' } });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('my bio');
  });
});
