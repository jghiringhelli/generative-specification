import request from 'supertest';
import { Application } from 'express';
import { buildTestHarness } from '../helpers/testApp';

describe('Authentication endpoints', () => {
  let app: Application;

  beforeEach(() => {
    app = buildTestHarness().app;
  });

  const validUser = {
    user: { username: 'alice', email: 'alice@example.com', password: 'secret123' },
  };

  describe('POST /api/users', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app).post('/api/users').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.user.username).toBe('alice');
      expect(res.body.user.email).toBe('alice@example.com');
      expect(typeof res.body.user.token).toBe('string');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('rejects duplicate email with 409', async () => {
      await request(app).post('/api/users').send(validUser);
      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'other', email: 'alice@example.com', password: 'secret123' } });
      expect(res.status).toBe(409);
      expect(res.body.errors).toBeDefined();
    });

    it('rejects duplicate username with 409', async () => {
      await request(app).post('/api/users').send(validUser);
      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'new@example.com', password: 'secret123' } });
      expect(res.status).toBe(409);
    });

    it('returns 422 when required fields are missing', async () => {
      const res = await request(app).post('/api/users').send({ user: { username: 'x' } });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 422 for an invalid email', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'bob', email: 'not-an-email', password: 'secret123' } });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/users').send(validUser);
    });

    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'alice@example.com', password: 'secret123' } });
      expect(res.status).toBe(200);
      expect(res.body.user.token).toBeDefined();
    });

    it('rejects a wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'alice@example.com', password: 'wrong' } });
      expect(res.status).toBe(401);
    });

    it('rejects an unknown email with 401', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'ghost@example.com', password: 'secret123' } });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user', () => {
    it('returns the current user when authenticated', async () => {
      const reg = await request(app).post('/api/users').send(validUser);
      const token = reg.body.user.token;
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('alice');
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
    });

    it('returns 401 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token not.a.jwt');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user', () => {
    it('updates mutable fields', async () => {
      const reg = await request(app).post('/api/users').send(validUser);
      const token = reg.body.user.token;
      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({ user: { bio: 'hello world', image: 'http://img' } });
      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('hello world');
      expect(res.body.user.image).toBe('http://img');
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).put('/api/user').send({ user: { bio: 'x' } });
      expect(res.status).toBe(401);
    });
  });
});
