import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../src/utils/jwt';

jest.mock('../src/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Auth & User Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users (Register)', () => {
    it('should register a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'jake',
        email: 'jake@example.com',
        password: 'hashedpassword',
        bio: null,
        image: null,
      });

      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'jake',
            email: 'jake@example.com',
            password: 'password123',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe('jake');
      expect(res.body.user.email).toBe('jake@example.com');
      expect(res.body.user).toHaveProperty('token');
    });

    it('should return 422 if username is already taken', async () => {
      (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.username === 'jake') {
          return Promise.resolve({ id: 1, username: 'jake', email: 'other@example.com' });
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'jake',
            email: 'jake@example.com',
            password: 'password123',
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.errors).toHaveProperty('username');
    });
  });

  describe('POST /api/users/login (Login)', () => {
    it('should log in an existing user with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'jake',
        email: 'jake@example.com',
        password: hashedPassword,
        bio: 'Bio text',
        image: null,
      });

      const res = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'jake@example.com',
            password: 'password123',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('jake');
      expect(res.body.user).toHaveProperty('token');
    });

    it('should return 422 on invalid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent@example.com',
            password: 'password123',
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.errors).toHaveProperty('email or password');
    });
  });

  describe('GET /api/user (Current User)', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = {
        id: 1,
        username: 'jake',
        email: 'jake@example.com',
        bio: 'Bio text',
        image: null,
      };
      const token = generateToken(mockUser);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('jake');
      expect(res.body.user.email).toBe('jake@example.com');
    });

    it('should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user (Update User)', () => {
    it('should update current user profile', async () => {
      const mockUser = {
        id: 1,
        username: 'jake',
        email: 'jake@example.com',
        bio: 'Old bio',
        image: null,
      };
      const token = generateToken(mockUser);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        bio: 'New updated bio',
      });

      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'New updated bio',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('New updated bio');
    });
  });
});
