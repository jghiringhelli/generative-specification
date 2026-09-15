import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/utils/jwt';

jest.mock('../src/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    follows: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Profiles Endpoints', () => {
  const currentUser = { id: 1, username: 'jake', email: 'jake@example.com' };
  const targetUser = { id: 2, username: 'jane', email: 'jane@example.com', bio: 'Jane bio', image: 'jane.jpg' };
  const token = generateToken(currentUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profiles/:username', () => {
    it('should return profile without auth', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(targetUser);

      const res = await request(app).get('/api/profiles/jane');

      expect(res.status).toBe(200);
      expect(res.body.profile.username).toBe('jane');
      expect(res.body.profile.following).toBe(false);
    });

    it('should return 404 for non-existent profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/profiles/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('should follow a user when authenticated', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(currentUser) // auth check
        .mockResolvedValueOnce(targetUser); // target check

      (prisma.follows.upsert as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/profiles/jane/follow')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.username).toBe('jane');
      expect(res.body.profile.following).toBe(true);
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).post('/api/profiles/jane/follow');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('should unfollow a user when authenticated', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(currentUser) // auth check
        .mockResolvedValueOnce(targetUser); // target check

      (prisma.follows.delete as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .delete('/api/profiles/jane/follow')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.username).toBe('jane');
      expect(res.body.profile.following).toBe(false);
    });
  });
});
