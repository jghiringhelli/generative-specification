import request from 'supertest';
import express from 'express';
import type { Express } from 'express';
import type { IProfileRepository, Profile } from '../src/repositories/IProfileRepository.js';
import { ProfileService } from '../src/services/ProfileService.js';
import { createProfileRouter } from '../src/routes/profile.routes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { NotFoundError } from '../src/errors/AppError.js';
import { sign } from 'jsonwebtoken';

// §8 DRY: In-memory profile repository fake — follows same pattern as InMemoryUserRepository.
class InMemoryProfileRepository implements IProfileRepository {
  private profiles: Map<string, { username: string; bio: string | null; image: string | null }> = new Map();
  private follows: Set<string> = new Set();

  addProfile(username: string, bio: string | null = null, image: string | null = null): void {
    this.profiles.set(username, { username, bio, image });
  }

  async findByUsername(username: string, currentUserId?: number): Promise<Profile | null> {
    const profile = this.profiles.get(username);
    if (!profile) return null;
    const followKey = `${currentUserId}:${username}`;
    return {
      ...profile,
      following: currentUserId !== undefined ? this.follows.has(followKey) : false,
    };
  }

  async follow(followerId: number, followingUsername: string): Promise<Profile> {
    const profile = this.profiles.get(followingUsername);
    if (!profile) throw new NotFoundError('User', followingUsername);
    this.follows.add(`${followerId}:${followingUsername}`);
    return { ...profile, following: true };
  }

  async unfollow(followerId: number, followingUsername: string): Promise<Profile> {
    const profile = this.profiles.get(followingUsername);
    if (!profile) throw new NotFoundError('User', followingUsername);
    this.follows.delete(`${followerId}:${followingUsername}`);
    return { ...profile, following: false };
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return Array.from(this.follows).some((key) => key.startsWith(`${followerId}:`));
  }

  reset(): void {
    this.profiles.clear();
    this.follows.clear();
  }
}

const JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long';

function buildTestApp(repo: IProfileRepository): Express {
  const app = express();
  app.use(express.json());
  const profileService = new ProfileService(repo);
  app.use('/api', createProfileRouter(profileService));
  app.use(errorHandler);
  return app;
}

function makeToken(userId: number): string {
  return sign({ userId }, JWT_SECRET);
}

describe('Profile endpoints', () => {
  let repo: InMemoryProfileRepository;
  let app: Express;

  beforeEach(() => {
    repo = new InMemoryProfileRepository();
    app = buildTestApp(repo);
    process.env['JWT_SECRET'] = JWT_SECRET;
  });

  describe('GET /api/profiles/:username', () => {
    it('returns 200 with profile when user exists', async () => {
      repo.addProfile('alice', 'My bio', 'https://example.com/alice.jpg');

      const res = await request(app).get('/api/profiles/alice');

      expect(res.status).toBe(200);
      expect(res.body.profile).toMatchObject({
        username: 'alice',
        bio: 'My bio',
        image: 'https://example.com/alice.jpg',
        following: false,
      });
    });

    it('returns 200 with following=true when authenticated user follows the profile', async () => {
      repo.addProfile('alice');
      const token = makeToken(42);

      // First follow alice
      await request(app)
        .post('/api/profiles/alice/follow')
        .set('Authorization', `Token ${token}`);

      const res = await request(app)
        .get('/api/profiles/alice')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(true);
    });

    it('returns 404 when user does not exist', async () => {
      const res = await request(app).get('/api/profiles/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('returns 200 with following=true on success', async () => {
      repo.addProfile('alice');
      const token = makeToken(42);

      const res = await request(app)
        .post('/api/profiles/alice/follow')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      repo.addProfile('alice');
      const res = await request(app).post('/api/profiles/alice/follow');
      expect(res.status).toBe(401);
    });

    it('returns 404 when target user does not exist', async () => {
      const token = makeToken(42);
      const res = await request(app)
        .post('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('returns 200 with following=false on success', async () => {
      repo.addProfile('alice');
      const token = makeToken(42);

      await request(app)
        .post('/api/profiles/alice/follow')
        .set('Authorization', `Token ${token}`);

      const res = await request(app)
        .delete('/api/profiles/alice/follow')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(false);
    });

    it('returns 401 when not authenticated', async () => {
      repo.addProfile('alice');
      const res = await request(app).delete('/api/profiles/alice/follow');
      expect(res.status).toBe(401);
    });

    it('returns 404 when target user does not exist', async () => {
      const token = makeToken(42);
      const res = await request(app)
        .delete('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
