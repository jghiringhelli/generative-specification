import request from 'supertest';
import { Express } from 'express';
import { buildTestApp, resetDatabase, disconnectDatabase, authHeader } from '../helpers/db';

describe('Authentication endpoints', () => {
  let app: Express;

  beforeAll(() => {
    app = buildTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  const validUser = { email: 'jane@example.com', username: 'jane', password: 'password123' };

  it('registers a new user and returns a token', async () => {
    const response = await request(app).post('/api/users').send({ user: validUser });
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(validUser.email);
    expect(response.body.user.username).toBe(validUser.username);
    expect(typeof response.body.user.token).toBe('string');
  });

  it('returns 422 when email is already registered', async () => {
    await request(app).post('/api/users').send({ user: validUser });
    const response = await request(app)
      .post('/api/users')
      .send({ user: { ...validUser, username: 'other' } });
    expect(response.status).toBe(422);
    expect(response.body.errors.body).toBeDefined();
  });

  it('returns 422 when registration input is invalid', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ user: { email: 'not-an-email', username: '', password: '' } });
    expect(response.status).toBe(422);
  });

  it('logs in successfully with correct credentials', async () => {
    await request(app).post('/api/users').send({ user: validUser });
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: validUser.email, password: validUser.password } });
    expect(response.status).toBe(200);
    expect(response.body.user.token).toBeDefined();
  });

  it('returns 422 when logging in with a wrong password', async () => {
    await request(app).post('/api/users').send({ user: validUser });
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: validUser.email, password: 'wrong-password' } });
    expect([401, 422]).toContain(response.status);
    expect(response.body.errors.body).toBeDefined();
  });

  it('returns the current user when a valid token is provided', async () => {
    const registration = await request(app).post('/api/users').send({ user: validUser });
    const token = registration.body.user.token;
    const response = await request(app).get('/api/user').set('Authorization', authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(validUser.email);
  });

  it('returns 401 when getting the current user without a token', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
  });

  it('updates the current user bio and email', async () => {
    const registration = await request(app).post('/api/users').send({ user: validUser });
    const token = registration.body.user.token;
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', authHeader(token))
      .send({ user: { bio: 'I like coding', email: 'jane2@example.com' } });
    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('I like coding');
    expect(response.body.user.email).toBe('jane2@example.com');
  });
});
