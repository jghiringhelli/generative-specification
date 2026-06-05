/**
 * Subcutaneous integration tests for the three profile endpoints.
 *
 * Supertest drives the REAL Express app — routing, optional/required auth,
 * error mapping, JWT verification — over the in-memory repository fakes. This
 * exercises the full HTTP → service → follow-graph path without external infra.
 * The Prisma adapter behind the same port is covered separately against a real
 * database.
 *
 * @gs-links: docs/specs/profiles.md, docs/use-cases.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { InMemoryArticleRepository } from '../adapters/persistence/InMemoryArticleRepository.js';
import { InMemoryCommentRepository } from '../adapters/persistence/InMemoryCommentRepository.js';
import { InMemoryProfileRepository } from '../adapters/persistence/InMemoryProfileRepository.js';
import { InMemoryUserRepository } from '../adapters/persistence/InMemoryUserRepository.js';
import { Argon2PasswordHasher } from '../adapters/security/Argon2PasswordHasher.js';
import { JwtTokenService } from '../adapters/security/JwtTokenService.js';
import { ArticleService } from '../services/ArticleService.js';
import { CommentService } from '../services/CommentService.js';
import { ProfileService } from '../services/ProfileService.js';
import { UserService } from '../services/UserService.js';
import { createApp } from './app.js';

const SECRET = 'integration-secret-at-least-32-bytes-xx';

interface ProfileBody {
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

interface UserBody {
  user: { token: string };
}

function buildApp(): Express {
  const users = new InMemoryUserRepository();
  const follows = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository();
  const tokens = new JwtTokenService(SECRET, '7d');
  const userService = new UserService(users, new Argon2PasswordHasher(), tokens);
  const profileService = new ProfileService(users, follows);
  const articleService = new ArticleService(articles, users, follows);
  const commentService = new CommentService(new InMemoryCommentRepository(), articles, users, follows);
  return createApp({
    userService,
    profileService,
    articleService,
    commentService,
    tokenService: tokens,
  });
}

/** Register a user and return its session token. */
async function register(app: Express, username: string): Promise<string> {
  const res = await request(app)
    .post('/api/users')
    .send({ user: { username, email: `${username}@example.com`, password: 'password123' } });
  return (res.body as UserBody).user.token;
}

describe('Profile endpoints', () => {
  let app: Express;
  let janeToken: string;
  beforeEach(async () => {
    app = buildApp();
    janeToken = await register(app, 'jane');
    await register(app, 'bob');
  });

  describe('GET /api/profiles/:username', () => {
    it('returns the profile with following=false for an anonymous request', async () => {
      const res = await request(app).get('/api/profiles/bob');
      expect(res.status).toBe(200);
      const body = res.body as ProfileBody;
      expect(body.profile.username).toBe('bob');
      expect(body.profile.bio).toBeNull();
      expect(body.profile.image).toBeNull();
      expect(body.profile.following).toBe(false);
    });

    it('returns following=false for an authenticated viewer who does not follow', async () => {
      const res = await request(app)
        .get('/api/profiles/bob')
        .set('Authorization', `Token ${janeToken}`);
      expect(res.status).toBe(200);
      expect((res.body as ProfileBody).profile.following).toBe(false);
    });

    it('returns following=true after the viewer follows the target', async () => {
      await request(app)
        .post('/api/profiles/bob/follow')
        .set('Authorization', `Token ${janeToken}`);
      const res = await request(app)
        .get('/api/profiles/bob')
        .set('Authorization', `Token ${janeToken}`);
      expect((res.body as ProfileBody).profile.following).toBe(true);
    });

    it('ignores an invalid token and serves the public (anonymous) view', async () => {
      const res = await request(app)
        .get('/api/profiles/bob')
        .set('Authorization', 'Token garbage');
      expect(res.status).toBe(200);
      expect((res.body as ProfileBody).profile.following).toBe(false);
    });

    it('returns 404 for an unknown username', async () => {
      const res = await request(app).get('/api/profiles/ghost');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('follows the target and returns following=true', async () => {
      const res = await request(app)
        .post('/api/profiles/bob/follow')
        .set('Authorization', `Token ${janeToken}`);
      expect(res.status).toBe(200);
      const body = res.body as ProfileBody;
      expect(body.profile.username).toBe('bob');
      expect(body.profile.following).toBe(true);
    });

    it('is idempotent — following twice still reports following=true', async () => {
      await request(app)
        .post('/api/profiles/bob/follow')
        .set('Authorization', `Token ${janeToken}`);
      const res = await request(app)
        .post('/api/profiles/bob/follow')
        .set('Authorization', `Token ${janeToken}`);
      expect(res.status).toBe(200);
      expect((res.body as ProfileBody).profile.following).toBe(true);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).post('/api/profiles/bob/follow');
      expect(res.status).toBe(401);
    });

    it('returns 404 when following an unknown username', async () => {
      const res = await request(app)
        .post('/api/profiles/ghost/follow')
        .set('Authorization', `Token ${janeToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('unfollows the target and returns following=false', async () => {
      await request(app)
        .post('/api/profiles/bob/follow')
        .set('Authorization', `Token ${janeToken}`);
      const res = await request(app)
        .delete('/api/profiles/bob/follow')
        .set('Authorization', `Token ${janeToken}`);
      expect(res.status).toBe(200);
      expect((res.body as ProfileBody).profile.following).toBe(false);
    });

    it('is a no-op when not currently following', async () => {
      const res = await request(app)
        .delete('/api/profiles/bob/follow')
        .set('Authorization', `Token ${janeToken}`);
      expect(res.status).toBe(200);
      expect((res.body as ProfileBody).profile.following).toBe(false);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).delete('/api/profiles/bob/follow');
      expect(res.status).toBe(401);
    });

    it('returns 404 when unfollowing an unknown username', async () => {
      const res = await request(app)
        .delete('/api/profiles/ghost/follow')
        .set('Authorization', `Token ${janeToken}`);
      expect(res.status).toBe(404);
    });
  });
});
