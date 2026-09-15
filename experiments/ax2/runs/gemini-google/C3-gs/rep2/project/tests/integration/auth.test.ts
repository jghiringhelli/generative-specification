import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { AuthService } from '../../src/services/AuthService';

describe('Auth Integration Tests (All 4 Endpoints)', () => {
  let app: any;
  let userRepository: InMemoryUserRepository;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    const authService = new AuthService(userRepository, 'integration-test-secret', '1h');
    process.env.JWT_SECRET = 'integration-test-secret';
    app = createApp({ userRepository, authService });
  });

  describe('POST /api/users (Registration)', () => {
    it('should register a new user and return status 201 with user object', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'johndoe@example.com',
            password: 'password123',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('johndoe');
      expect(response.body.user.email).toBe('johndoe@example.com');
      expect(typeof response.body.user.token).toBe('string');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 422 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
          },
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
    });

    it('should return 409 when user already exists', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'johndoe@example.com',
            password: 'password123',
          },
        });

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            email: 'another@example.com',
            password: 'password123',
          },
        });

      expect(response.status).toBe(409);
      expect(response.body.errors).toHaveProperty('body');
    });
  });

  describe('POST /api/users/login (Login)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'logintest',
            email: 'logintest@example.com',
            password: 'validPassword123',
          },
        });
    });

    it('should log in successfully and return status 200 with JWT token', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'logintest@example.com',
            password: 'validPassword123',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('logintest@example.com');
      expect(response.body.user.username).toBe('logintest');
      expect(typeof response.body.user.token).toBe('string');
    });

    it('should return 401 when given incorrect password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'logintest@example.com',
            password: 'incorrectPassword',
          },
        });

      expect(response.status).toBe(401);
      expect(response.body.errors).toHaveProperty('body');
    });
  });

  describe('GET /api/user (Current User)', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'currentuser',
            email: 'current@example.com',
            password: 'password123',
          },
        });
      token = res.body.user.token;
    });

    it('should return 200 with current user data when Token header is supplied', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('current@example.com');
      expect(response.body.user.username).toBe('currentuser');
    });

    it('should return 401 when no token is supplied', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body.errors).toHaveProperty('body');
    });
  });

  describe('PUT /api/user (Update User)', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'updateuser',
            email: 'update@example.com',
            password: 'password123',
          },
        });
      token = res.body.user.token;
    });

    it('should update bio and image and return status 200', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'I like coding in TypeScript',
            image: 'https://i.pravatar.cc/300',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toBe('I like coding in TypeScript');
      expect(response.body.user.image).toBe('https://i.pravatar.cc/300');
      expect(response.body.user.username).toBe('updateuser');
    });

    it('should return 401 if unauthorized', async () => {
      const response = await request(app)
        .put('/api/user')
        .send({
          user: {
            bio: 'Unauthorized attempt',
          },
        });

      expect(response.status).toBe(401);
    });
  });
});
