import request from 'supertest';
import { Express } from 'express';
import { buildTestHarness } from '../helpers/testApp';

/**
 * Register a user through the API and return the issued token.
 * @param app - The Express app under test.
 * @param overrides - Optional field overrides.
 * @returns The auth token.
 */
async function registerUser(
  app: Express,
  overrides: Partial<{ username: string; email: string; password: string }> = {}
): Promise<string> {
  const user = {
    username: 'jane',
    email: 'jane@example.com',
    password: 'secret123',
    ...overrides
  };
  const res = await request(app).post('/api/users').send({ user });
  return res.body.user.token;
}

describe('POST /api/users (register)', () => {
  it('creates a user and returns 201', async () => {
    const { app } = buildTestHarness();
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: 'jane', email: 'jane@example.com', password: 'secret123' } });
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('jane');
    expect(res.body.user.token).toEqual(expect.any(String));
  });

  it('returns 422 for invalid input in Conduit error format', async () => {
    const { app } = buildTestHarness();
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: 'jane', password: 'secret123' } });
    expect(res.status).toBe(422);
    expect(res.body.errors.body).toEqual(expect.any(Array));
    expect(res.body.errors.body.length).toBeGreaterThan(0);
  });

  it('returns 409 for a duplicate email', async () => {
    const { app } = buildTestHarness();
    await registerUser(app);
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: 'other', email: 'jane@example.com', password: 'secret123' } });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/users/login', () => {
  it('logs in with valid credentials', async () => {
    const { app } = buildTestHarness();
    await registerUser(app);
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'jane@example.com', password: 'secret123' } });
    expect(res.status).toBe(200);
    expect(res.body.user.token).toEqual(expect.any(String));
  });

  it('returns 401 for wrong password', async () => {
    const { app } = buildTestHarness();
    await registerUser(app);
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'jane@example.com', password: 'wrong' } });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/user', () => {
  it('returns the current user when authenticated', async () => {
    const { app } = buildTestHarness();
    const token = await registerUser(app);
    const res = await request(app).get('/api/user').set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('jane@example.com');
  });

  it('returns 401 without a token', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user', () => {
  it('updates the current user', async () => {
    const { app } = buildTestHarness();
    const token = await registerUser(app);
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'updated bio' } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('updated bio');
  });

  it('returns 401 without a token', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).put('/api/user').send({ user: { bio: 'x' } });
    expect(res.status).toBe(401);
  });
});
