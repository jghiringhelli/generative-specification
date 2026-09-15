import request from 'supertest';
import { Application } from 'express';
import { buildTestApp, prisma, resetDatabase } from './helpers';

let app: Application;

beforeAll(() => {
  app = buildTestApp();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const validUser = {
  user: { email: 'jane@example.com', username: 'jane', password: 'password123' }
};

describe('POST /api/users (register)', () => {
  it('creates a user and returns a token on success', async () => {
    const res = await request(app).post('/api/users').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('jane@example.com');
    expect(res.body.user.username).toBe('jane');
    expect(typeof res.body.user.token).toBe('string');
  });

  it('returns 422 when email is already registered', async () => {
    await request(app).post('/api/users').send(validUser);
    const res = await request(app)
      .post('/api/users')
      .send({ user: { email: 'jane@example.com', username: 'other', password: 'password123' } });
    expect(res.status).toBe(422);
    expect(res.body.errors.body).toBeDefined();
  });

  it('returns 422 when the email is invalid', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: { email: 'not-an-email', username: 'x', password: 'y' } });
    expect(res.status).toBe(422);
    expect(res.body.errors.body.length).toBeGreaterThan(0);
  });
});

describe('POST /api/users/login', () => {
  it('returns a token when credentials are correct', async () => {
    await request(app).post('/api/users').send(validUser);
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'jane@example.com', password: 'password123' } });
    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
  });

  it('returns 422 when the password is wrong', async () => {
    await request(app).post('/api/users').send(validUser);
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'jane@example.com', password: 'wrong-password' } });
    expect(res.status).toBe(401);
    expect(res.body.errors.body).toBeDefined();
  });
});

describe('GET /api/user (current user)', () => {
  it('returns the current user when a valid token is provided', async () => {
    const register = await request(app).post('/api/users').send(validUser);
    const token = register.body.user.token;
    const res = await request(app).get('/api/user').set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('jane');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user (update)', () => {
  it('updates the current user bio and email', async () => {
    const register = await request(app).post('/api/users').send(validUser);
    const token = register.body.user.token;
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'I write code', email: 'jane2@example.com' } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('I write code');
    expect(res.body.user.email).toBe('jane2@example.com');
  });

  it('returns 401 when updating without a token', async () => {
    const res = await request(app).put('/api/user').send({ user: { bio: 'x' } });
    expect(res.status).toBe(401);
  });
});
