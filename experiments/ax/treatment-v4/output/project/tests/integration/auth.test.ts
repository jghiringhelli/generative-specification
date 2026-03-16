import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Application } from 'express';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://conduit:conduit@localhost:5432/conduit_test'
    }
  }
});

describe('Authentication Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    app = createApp(prisma);
    try {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
    } catch (error) {
      console.warn('Could not truncate tables - database may not be available');
    }
  });

  afterEach(async () => {
    try {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
    } catch (error) {
      console.warn('Could not truncate tables - database may not be available');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/users (register)', () => {
    it('register_with_valid_data_returns_201_with_user_and_token', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null
      });
      expect(response.body.user.token).toBeDefined();
    });

    it('register_without_email_returns_422', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.body).toBeInstanceOf(Array);
    });

    it('register_with_invalid_email_returns_422', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'not-an-email',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('email');
    });

    it('register_with_duplicate_email_returns_422', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'user1',
            password: 'password123'
          }
        });

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'user2',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('Email already taken');
    });

    it('register_with_short_password_returns_422', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'short'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('at least 8 characters');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });
    });

    it('login_with_valid_credentials_returns_200_with_user_and_token', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        username: 'testuser'
      });
      expect(response.body.user.token).toBeDefined();
    });

    it('login_with_invalid_email_returns_422', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'wrong@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('invalid');
    });

    it('login_with_invalid_password_returns_422', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('invalid');
    });

    it('login_without_password_returns_422', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/user (get current user)', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });
      token = response.body.user.token;
    });

    it('get_current_user_with_valid_token_returns_200_with_user', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        username: 'testuser'
      });
      expect(response.body.user.token).toBeDefined();
    });

    it('get_current_user_without_token_returns_401', async () => {
      const response = await request(app)
        .get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body.errors.body[0]).toContain('authorization');
    });

    it('get_current_user_with_invalid_token_returns_401', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.errors.body[0]).toContain('Invalid token');
    });

    it('get_current_user_with_bearer_prefix_returns_401', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.errors.body[0]).toContain('authorization');
    });
  });

  describe('PUT /api/user (update user)', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });
      token = response.body.user.token;
    });

    it('update_email_returns_200_with_updated_user', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            email: 'newemail@example.com'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('newemail@example.com');
    });

    it('update_bio_and_image_returns_200_with_updated_user', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'My new bio',
            image: 'https://example.com/avatar.jpg'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toBe('My new bio');
      expect(response.body.user.image).toBe('https://example.com/avatar.jpg');
    });

    it('update_without_token_returns_401', async () => {
      const response = await request(app)
        .put('/api/user')
        .send({
          user: {
            bio: 'New bio'
          }
        });

      expect(response.status).toBe(401);
    });

    it('update_with_invalid_image_url_returns_422', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            image: 'not-a-url'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('Invalid image URL');
    });
  });
});
