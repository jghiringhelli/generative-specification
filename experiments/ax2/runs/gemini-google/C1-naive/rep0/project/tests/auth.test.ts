import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/prisma';

jest.mock('../src/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}));

describe('Authentication & User Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users (register)', () => {
    it('should register a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: '',
        image: ''
      });

      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.token).toBeDefined();
    });

    it('should reject registration if email is missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.email).toBeDefined();
    });

    it('should reject registration if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 2,
        email: 'existing@example.com',
        username: 'existing'
      });

      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'testuser',
            email: 'existing@example.com',
            password: 'password123'
          }
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.email).toContain('has already been taken');
    });
  });

  describe('POST /api/users/login', () => {
    it('should reject login for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'nobody@example.com',
            password: 'password123'
          }
        });

      expect(res.status).toBe(422);
      expect(res.body.errors['email or password']).toBeDefined();
    });
  });

  describe('GET /api/user (current user)', () => {
    it('should return 401 without authorization header', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
      expect(res.body.errors.authorization).toBeDefined();
    });
  });
});
