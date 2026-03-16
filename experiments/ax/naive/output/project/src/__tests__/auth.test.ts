import request from 'supertest';
import { app } from '../app';
import { cleanup } from './helpers';

describe('Authentication', () => {
  afterEach(async () => {
    await cleanup();
  });

  describe('POST /api/users (register)', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: 'test@test.com',
        username: 'testuser',
        bio: null,
        image: null
      });
      expect(response.body.user.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'user1',
            password: 'password123'
          }
        });

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'user2',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
    });

    it('should reject duplicate username', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'user1@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'user2@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'notanemail',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@test.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: 'test@test.com',
        username: 'testuser'
      });
      expect(response.body.user.token).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'wrong@test.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(401);
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@test.com',
            password: 'wrongpassword'
          }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/user', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });
      token = response.body.user.token;
    });

    it('should get current user', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: 'test@test.com',
        username: 'testuser'
      });
    });

    it('should reject without token', async () => {
      const response = await request(app).get('/api/user');
      expect(response.status).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token invalidtoken');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/user', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });
      token = response.body.user.token;
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'New bio',
            image: 'https://example.com/image.jpg'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: 'test@test.com',
        username: 'testuser',
        bio: 'New bio',
        image: 'https://example.com/image.jpg'
      });
    });

    it('should update email', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            email: 'newemail@test.com'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('newemail@test.com');
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .put('/api/user')
        .send({
          user: {
            bio: 'New bio'
          }
        });
      expect(response.status).toBe(401);
    });
  });
});
