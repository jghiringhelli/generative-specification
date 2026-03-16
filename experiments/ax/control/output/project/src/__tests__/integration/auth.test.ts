import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/users', () => {
    it('registers a new user successfully', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('email', 'john@example.com');
      expect(response.body.user).toHaveProperty('username', 'johndoe');
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('bio', null);
      expect(response.body.user).toHaveProperty('image', null);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('returns 422 when email is already registered', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'password123'
          }
        });

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'janedoe',
            email: 'john@example.com',
            password: 'password456'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Email already registered');
    });

    it('returns 422 when username is already taken', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'password123'
          }
        });

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'jane@example.com',
            password: 'password456'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Username already taken');
    });

    it('returns 422 when email is invalid', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'invalid-email',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Invalid email format');
    });

    it('returns 422 when password is too short', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'short'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain(
        'Password must be at least 8 characters'
      );
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'password123'
          }
        });
    });

    it('logs in successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'john@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', 'john@example.com');
      expect(response.body.user).toHaveProperty('username', 'johndoe');
      expect(response.body.user).toHaveProperty('token');
    });

    it('returns 401 when password is incorrect', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'john@example.com',
            password: 'wrongpassword'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Invalid email or password');
    });

    it('returns 401 when email does not exist', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Invalid email or password');
    });
  });

  describe('GET /api/user', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'password123'
          }
        });

      token = response.body.user.token;
    });

    it('returns current user with valid token', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', 'john@example.com');
      expect(response.body.user).toHaveProperty('username', 'johndoe');
      expect(response.body.user).toHaveProperty('token');
    });

    it('returns 401 when token is missing', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Unauthorized');
    });

    it('returns 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Invalid or expired token');
    });
  });

  describe('PUT /api/user', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'password123'
          }
        });

      token = response.body.user.token;
    });

    it('updates user email successfully', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            email: 'newemail@example.com'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', 'newemail@example.com');
    });

    it('updates user bio and image successfully', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'I like coding',
            image: 'https://example.com/avatar.jpg'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('bio', 'I like coding');
      expect(response.body.user).toHaveProperty('image', 'https://example.com/avatar.jpg');
    });

    it('updates user password successfully', async () => {
      const updateResponse = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            password: 'newpassword123'
          }
        });

      expect(updateResponse.status).toBe(200);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'john@example.com',
            password: 'newpassword123'
          }
        });

      expect(loginResponse.status).toBe(200);
    });

    it('returns 401 when token is missing', async () => {
      const response = await request(app)
        .put('/api/user')
        .send({
          user: {
            bio: 'New bio'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Unauthorized');
    });

    it('returns 422 when email is already in use by another user', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'janedoe',
            email: 'jane@example.com',
            password: 'password123'
          }
        });

      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            email: 'jane@example.com'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Email already in use');
    });
  });
});
