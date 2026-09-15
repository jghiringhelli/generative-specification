import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Authentication Endpoints Integration Tests', () => {
  const timestamp = Date.now();
  const testUser = {
    username: `authuser_${timestamp}`,
    email: `auth_${timestamp}@example.com`,
    password: 'password123'
  };

  afterAll(async () => {
    // Cleanup created users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'example.com'
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/users', () => {
    it('creates a new user and returns user payload with token on valid input', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ user: testUser });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('returns 422 when email is already registered', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: `another_${Date.now()}`,
            email: testUser.email,
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.body).toEqual(
        expect.arrayContaining([expect.stringContaining('already registered')])
      );
    });

    it('returns 422 when registration payload fails validation', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: '',
            email: 'invalid-email',
            password: '123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/users/login', () => {
    it('authenticates user and returns token on correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: testUser.email,
            password: testUser.password
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.token).toBeDefined();
    });

    it('returns 422 when password does not match during login', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: testUser.email,
            password: 'completelyWrongPassword'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.body).toEqual(
        expect.arrayContaining([expect.stringContaining('invalid email or password')])
      );
    });

    it('returns 422 when email does not exist during login', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/user', () => {
    let authToken = '';

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: testUser.email,
            password: testUser.password
          }
        });
      authToken = loginRes.body.user.token;
    });

    it('returns current user profile when valid token is provided', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
    });

    it('returns 401 when request is made without authorization token', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/user', () => {
    let authToken = '';

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: testUser.email,
            password: testUser.password
          }
        });
      authToken = loginRes.body.user.token;
    });

    it('updates user bio and image when authenticated', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .send({
          user: {
            bio: 'Updated bio information',
            image: 'https://example.com/avatar.png'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toBe('Updated bio information');
      expect(response.body.user.image).toBe('https://example.com/avatar.png');
    });

    it('returns 401 when update is attempted without authorization token', async () => {
      const response = await request(app)
        .put('/api/user')
        .send({
          user: {
            bio: 'Unauthorized attempt'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });
  });
});
