import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/utils/jwt';

jest.mock('../src/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    follow: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Profile Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = generateToken({ id: 1, email: 'follower@example.com', username: 'follower' });

  describe('GET /api/profiles/:username', () => {
    it('should return profile for existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        username: 'targetuser',
        bio: 'Hello world',
        image: 'https://avatar.png'
      });

      const res = await request(app).get('/api/profiles/targetuser');
      expect(res.status).toBe(200);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.username).toBe('targetuser');
      expect(res.body.profile.following).toBe(false);
    });

    it('should return 404 for non-existent profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/profiles/notfound');
      expect(res.status).toBe(404);
      expect(res.body.errors.profile).toBeDefined();
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/profiles/targetuser/follow');
      expect(res.status).toBe(401);
    });

    it('should follow a user when authenticated', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        username: 'targetuser',
        bio: 'Bio',
        image: ''
      });
      (prisma.follow.upsert as jest.Mock).mockResolvedValue({
        followerId: 1,
        followingId: 2
      });

      const res = await request(app)
        .post('/api/profiles/targetuser/follow')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('should unfollow a user when authenticated', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        username: 'targetuser',
        bio: 'Bio',
        image: ''
      });
      (prisma.follow.delete as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .delete('/api/profiles/targetuser/follow')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(false);
    });
  });
});
