// tests/integration/auth.test.ts
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/prisma';

const app = createApp();

describe('Auth Endpoints Integration Tests', () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'Password123!';
  let userToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'integration-test-secret';
  });

  describe('POST /api/users', () => {
    it('should register a new user successfully with 201', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: testEmail,
            username: testUsername,
            password: testPassword
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user.username).toBe(testUsername);
      expect(response.body.user.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return 422 if username or email is already taken', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: testEmail,
            username: testUsername,
            password: testPassword
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 422 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: '',
            password: ''
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    it('should log in successfully with valid credentials and return 200', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: testEmail,
            password: testPassword
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.token).toBeDefined();
      userToken = response.body.user.token;
    });

    it('should return 422 on invalid password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: testEmail,
            password: 'WrongPassword'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/user', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user.username).toBe(testUsername);
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app).get('/api/user');
      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/user', () => {
    it('should update current user profile', async () => {
      const newBio = 'Updated integration test bio';
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${userToken}`)
        .send({
          user: {
            bio: newBio
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toBe(newBio);
    });

    it('should return 401 when updating without auth token', async () => {
      const response = await request(app)
        .put('/api/user')
        .send({
          user: {
            bio: 'Unauthorized update'
          }
        });

      expect(response.status).toBe(401);
    });
  });
});
