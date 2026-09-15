import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, authHeader } from '../helpers/app';
import { resetDatabase, disconnectDatabase } from '../helpers/db';

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

describe('POST /api/users (register)', () => {
  it('registers a new user and returns a token', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123'
        }
      });
    expect(response.status).toBe(201);
    expect(response.body.user.username).toBe('alice');
    expect(response.body.user.email).toBe('alice@example.com');
    expect(typeof response.body.user.token).toBe('string');
  });

  it('returns 422 when email is already registered', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123'
        }
      });
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'alice2',
          email: 'alice@example.com',
          password: 'password123'
        }
      });
    expect(response.status).toBe(422);
    expect(response.body.errors.body).toBeInstanceOf(Array);
  });

  it('returns 422 when the email is invalid', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: { username: 'bob', email: 'not-an-email', password: 'pw' }
      });
    expect(response.status).toBe(422);
    expect(response.body.errors.body).toBeInstanceOf(Array);
  });
});

describe('POST /api/users/login (login)', () => {
  it('logs in an existing user with correct credentials', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123'
        }
      });
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'alice@example.com', password: 'password123' } });
    expect(response.status).toBe(200);
    expect(response.body.user.token).toBeDefined();
  });

  it('returns 422 when the password is wrong', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123'
        }
      });
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'alice@example.com', password: 'wrong' } });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/user (current user)', () => {
  it('returns the current user when a valid token is supplied', async () => {
    const register = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123'
        }
      });
    const token = register.body.user.token as string;
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('alice@example.com');
  });

  it('returns 401 when no token is provided', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
    expect(response.body.errors.body).toBeInstanceOf(Array);
  });
});

describe('PUT /api/user (update user)', () => {
  it('updates the current user bio and email', async () => {
    const register = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123'
        }
      });
    const token = register.body.user.token as string;
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', authHeader(token))
      .send({ user: { bio: 'I write code', email: 'alice2@example.com' } });
    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('I write code');
    expect(response.body.user.email).toBe('alice2@example.com');
  });

  it('returns 401 when updating without a token', async () => {
    const response = await request(app)
      .put('/api/user')
      .send({ user: { bio: 'nope' } });
    expect(response.status).toBe(401);
  });
});
