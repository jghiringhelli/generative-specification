import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

// Mock prisma for isolated unit/integration tests
jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users', () => {
    it('should register a new user successfully', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: '',
        image: null
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

    it('should return 422 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'testuser'
          }
        });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 422 if email or username is already taken', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'existinguser'
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

      expect(res.status).toBe(422);
      expect(res.body.errors.email).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    it('should return 422 if credentials are missing or user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'notfound@example.com',
            password: 'wrongpassword'
          }
        });

      expect(res.status).toBe(422);
      expect(res.body.errors['email or password']).toBeDefined();
    });
  });

  describe('GET /api/user', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
    });
  });
});
