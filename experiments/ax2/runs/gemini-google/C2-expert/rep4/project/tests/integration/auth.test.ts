import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('Authentication Endpoints Integration', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/users (register)', () => {
    it('creates a new user and returns 201 with auth token and profile', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'password123',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('johndoe');
      expect(response.body.user.email).toBe('john@example.com');
      expect(response.body.user.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('returns 422 when email is already registered', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe1',
            email: 'duplicate@example.com',
            password: 'password123',
          },
        });

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe2',
            email: 'duplicate@example.com',
            password: 'password123',
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.body).toContain('Email is already taken');
    });

    it('returns 422 when required fields are missing in registration', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'notanemail',
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors.body)).toBe(true);
    });
  });

  describe('POST /api/users/login (login)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'logintest',
            email: 'login@example.com',
            password: 'correctpassword',
          },
        });
    });

    it('authenticates user with valid credentials and returns 200 with token', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'correctpassword',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.user.token).toBeDefined();
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.user.username).toBe('logintest');
    });

    it('returns 422 when password is incorrect', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'wrongpassword',
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Invalid email or password');
    });

    it('returns 422 when user does not exist', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent@example.com',
            password: 'anyPassword123',
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Invalid email or password');
    });
  });

  describe('GET /api/user (current user)', () => {
    it('returns current user details when valid authorization token is provided', async () => {
      const registerRes = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'currentuser',
            email: 'current@example.com',
            password: 'password123',
          },
        });

      const token = registerRes.body.user.token;

      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('current@example.com');
      expect(response.body.user.username).toBe('currentuser');
      expect(response.body.user.token).toBeDefined();
    });

    it('returns 401 when authorization token is missing', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.body).toBeDefined();
    });
  });

  describe('PUT /api/user (update user)', () => {
    it('updates user bio and image and returns 200 with updated fields', async () => {
      const registerRes = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'updatetest',
            email: 'update@example.com',
            password: 'password123',
          },
        });

      const token = registerRes.body.user.token;

      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'I like writing TypeScript code',
            image: 'https://example.com/avatar.png',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toBe('I like writing TypeScript code');
      expect(response.body.user.image).toBe('https://example.com/avatar.png');
      expect(response.body.user.username).toBe('updatetest');
    });
  });
});
