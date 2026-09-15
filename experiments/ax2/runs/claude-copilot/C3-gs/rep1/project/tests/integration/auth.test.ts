import request from 'supertest';
import { buildTestHarness } from '../helpers/testHarness';
import { authHeader, registerUser } from '../helpers/apiClient';

describe('Auth endpoints', () => {
  it('POST /api/users registers a user', async () => {
    const { app } = buildTestHarness();
    const response = await request(app)
      .post('/api/users')
      .send({ user: { username: 'alice', email: 'alice@example.com', password: 'password123' } });
    expect(response.status).toBe(201);
    expect(response.body.user.username).toBe('alice');
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it('POST /api/users rejects invalid input with 422', async () => {
    const { app } = buildTestHarness();
    const response = await request(app)
      .post('/api/users')
      .send({ user: { username: '', email: 'bad', password: 'x' } });
    expect(response.status).toBe(422);
    expect(response.body.errors.body.length).toBeGreaterThan(0);
  });

  it('POST /api/users/login authenticates a registered user', async () => {
    const { app } = buildTestHarness();
    await registerUser(app);
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'alice@example.com', password: 'password123' } });
    expect(response.status).toBe(200);
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it('POST /api/users/login rejects wrong credentials with 401', async () => {
    const { app } = buildTestHarness();
    await registerUser(app);
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'alice@example.com', password: 'wrongpassword' } });
    expect(response.status).toBe(401);
  });

  it('GET /api/user returns the current user when authenticated', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const response = await request(app).get('/api/user').set('Authorization', authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('alice@example.com');
  });

  it('GET /api/user rejects a missing token with 401', async () => {
    const { app } = buildTestHarness();
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
  });

  it('PUT /api/user updates the current user', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', authHeader(token))
      .send({ user: { bio: 'updated bio' } });
    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('updated bio');
  });
});
