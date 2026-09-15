import request from 'supertest';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser } from '../builders/userBuilder';

describe('Authentication endpoints', () => {
  let harness: ReturnType<typeof buildTestHarness>;

  beforeEach(() => {
    harness = buildTestHarness();
  });

  describe('POST /api/users', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(harness.app)
        .post('/api/users')
        .send({
          user: {
            username: 'alice',
            email: 'alice@example.com',
            password: 'secret123',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.user.username).toBe('alice');
      expect(res.body.user.email).toBe('alice@example.com');
      expect(typeof res.body.user.token).toBe('string');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('rejects registration with a duplicate email (422)', async () => {
      await registerUser(harness.app, { email: 'dupe@example.com' });
      const res = await request(harness.app)
        .post('/api/users')
        .send({
          user: {
            username: 'other',
            email: 'dupe@example.com',
            password: 'secret123',
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.email).toBeDefined();
    });

    it('rejects invalid input with 422 in spec error shape', async () => {
      const res = await request(harness.app)
        .post('/api/users')
        .send({ user: { username: '', email: 'nope', password: '' } });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/users/login', () => {
    it('logs in with valid credentials', async () => {
      await request(harness.app).post('/api/users').send({
        user: { username: 'bob', email: 'bob@example.com', password: 'pw12345' },
      });

      const res = await request(harness.app)
        .post('/api/users/login')
        .send({ user: { email: 'bob@example.com', password: 'pw12345' } });

      expect(res.status).toBe(200);
      expect(res.body.user.token).toBeDefined();
    });

    it('rejects invalid credentials with 401', async () => {
      await request(harness.app).post('/api/users').send({
        user: { username: 'carol', email: 'carol@example.com', password: 'pw12345' },
      });

      const res = await request(harness.app)
        .post('/api/users/login')
        .send({ user: { email: 'carol@example.com', password: 'wrong' } });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user', () => {
    it('returns the current user when authenticated', async () => {
      const user = await registerUser(harness.app, { username: 'dan' });
      const res = await request(harness.app)
        .get('/api/user')
        .set('Authorization', authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('dan');
    });

    it('returns 401 without a token', async () => {
      const res = await request(harness.app).get('/api/user');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user', () => {
    it('updates the current user', async () => {
      const user = await registerUser(harness.app, { username: 'ellen' });
      const res = await request(harness.app)
        .put('/api/user')
        .set('Authorization', authHeader(user.token))
        .send({ user: { bio: 'hello world' } });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('hello world');
    });

    it('returns 401 without a token', async () => {
      const res = await request(harness.app)
        .put('/api/user')
        .send({ user: { bio: 'x' } });
      expect(res.status).toBe(401);
    });
  });
});
