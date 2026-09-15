import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn()
    },
    follows: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Profiles Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profiles/:username', () => {
    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/profiles/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.errors.profile).toBeDefined();
    });

    it('should return user profile if found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        username: 'alice',
        bio: 'Hello world',
        image: 'https://example.com/avatar.jpg'
      });

      const res = await request(app).get('/api/profiles/alice');
      expect(res.status).toBe(200);
      expect(res.body.profile).toEqual({
        username: 'alice',
        bio: 'Hello world',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).post('/api/profiles/alice/follow');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).delete('/api/profiles/alice/follow');
      expect(res.status).toBe(401);
    });
  });
});
