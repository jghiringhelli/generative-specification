import request from 'supertest';
import { app } from '../../src/app';
import { clearDatabase, disconnectDatabase } from '../helpers/test-db';

describe('Authentication endpoints', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/users (register)', () => {
    it('returns 201 with user payload and JWT token on successful registration', async () => {
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
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('alice');
      expect(response.body.user.email).toBe('alice@example.com');
      expect(response.body.user.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('returns 422 when email is already registered', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'alice',
            email: 'duplicate@example.com',
            password: 'password123'
          }
        });

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'bob',
            email: 'duplicate@example.com',
            password: 'password456'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.body).toContain('Email is already registered');
    });

    it('returns 422 when registration payload fails validation', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: '',
            email: 'not-an-email',
            password: ''
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'loginuser',
            email: 'login@example.com',
            password: 'correctpassword'
          }
        });
    });

    it('returns 200 with user data and token on valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'correctpassword'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.user.username).toBe('loginuser');
      expect(response.body.user.token).toBeDefined();
    });

    it('returns 422 when password is incorrect', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'wrongpassword'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Invalid email or password');
    });

    it('returns 422 when user email does not exist', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent@example.com',
            password: 'somepassword'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Invalid email or password');
    });
  });

  describe('GET /api/user', () => {
    it('returns 200 with current user when authorized token is supplied', async () => {
      const registerRes = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'currentuser',
            email: 'current@example.com',
            password: 'password123'
          }
        });

      const token = registerRes.body.user.token;

      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('currentuser');
      expect(response.body.user.email).toBe('current@example.com');
    });

    it('returns 401 when authorization token is missing', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Authentication token is required');
    });
  });

  describe('PUT /api/user', () => {
    it('returns 200 with updated fields when authorized user modifies profile', async () => {
      const registerRes = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'updateuser',
            email: 'update@example.com',
            password: 'password123'
          }
        });

      const token = registerRes.body.user.token;

      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'Updated bio information',
            image: 'https://example.com/avatar.jpg'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toBe('Updated bio information');
      expect(response.body.user.image).toBe('https://example.com/avatar.jpg');
    });

    it('returns 401 when updating profile without authorization token', async () => {
      const response = await request(app)
        .put('/api/user')
        .send({
          user: {
            bio: 'Hacker bio'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Authentication token is required');
    });

    it('returns 422 when updating email to an address already taken', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'firstuser',
            email: 'first@example.com',
            password: 'password123'
          }
        });

      const secondRes = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'seconduser',
            email: 'second@example.com',
            password: 'password123'
          }
        });

      const secondToken = secondRes.body.user.token;

      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${secondToken}`)
        .send({
          user: {
            email: 'first@example.com'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Email is already registered');
    });
  });
});
