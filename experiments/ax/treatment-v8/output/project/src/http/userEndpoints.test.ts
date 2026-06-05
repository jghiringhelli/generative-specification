/**
 * Subcutaneous integration tests for the four auth endpoints.
 *
 * Supertest drives the REAL Express app — real routing, validation, auth
 * middleware, error mapping, JWT signing/verification, and Argon2 hashing — over
 * an in-memory repository fake (a working implementation, not a mock). This
 * exercises the full request/response cycle without external infrastructure.
 * The Prisma adapter behind the same port is verified separately by
 * PrismaUserRepository.test.ts against a real database.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md, docs/use-cases.md
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

interface UserBody {
  user: {
    email: string;
    username: string;
    token: string;
    bio: string | null;
    image: string | null;
  };
}

interface ErrorBody {
  errors: Record<string, string[]>;
}

function buildApp(): Express {
  const repo = new InMemoryUserRepository();
  const follows = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository();
  const tokens = new JwtTokenService(SECRET, '7d');
  const service = new UserService(repo, new Argon2PasswordHasher(), tokens);
  const profileService = new ProfileService(repo, follows);
  const articleService = new ArticleService(articles, repo, follows);
  const commentService = new CommentService(new InMemoryCommentRepository(), articles, repo, follows);
  return createApp({
    userService: service,
    profileService,
    articleService,
    commentService,
    tokenService: tokens,
  });
}

const validUser = { username: 'jane', email: 'jane@example.com', password: 'password123' };

describe('Auth endpoints', () => {
  let app: Express;
  beforeEach(() => {
    app = buildApp();
  });

  describe('POST /api/users (register)', () => {
    it('creates a user and returns the user envelope with a token', async () => {
      const res = await request(app).post('/api/users').send({ user: validUser });
      const body = res.body as UserBody;
      expect(res.status).toBe(201);
      expect(body.user.email).toBe('jane@example.com');
      expect(body.user.username).toBe('jane');
      expect(body.user.bio).toBeNull();
      expect(typeof body.user.token).toBe('string');
    });

    it('never leaks the password or its hash', async () => {
      const res = await request(app).post('/api/users').send({ user: validUser });
      expect(res.body).not.toHaveProperty('user.password');
      expect(res.body).not.toHaveProperty('user.passwordHash');
    });

    it('issues a token that authenticates against GET /api/user', async () => {
      const res = await request(app).post('/api/users').send({ user: validUser });
      const { token } = (res.body as UserBody).user;
      const me = await request(app).get('/api/user').set('Authorization', `Token ${token}`);
      expect(me.status).toBe(200);
      expect((me.body as UserBody).user.email).toBe('jane@example.com');
    });

    it('rejects an invalid email with 422 and a field error', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: { ...validUser, email: 'not-an-email' } });
      expect(res.status).toBe(422);
      expect((res.body as ErrorBody).errors.email).toBeDefined();
    });

    it('rejects a too-short password with 422', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: { ...validUser, password: 'short' } });
      expect(res.status).toBe(422);
      expect((res.body as ErrorBody).errors.password).toBeDefined();
    });

    it('rejects a missing user object with 422', async () => {
      const res = await request(app).post('/api/users').send({});
      expect(res.status).toBe(422);
    });

    it('rejects a duplicate email with 409', async () => {
      await request(app).post('/api/users').send({ user: validUser });
      const res = await request(app)
        .post('/api/users')
        .send({ user: { ...validUser, username: 'different' } });
      expect(res.status).toBe(409);
    });

    it('rejects a duplicate username with 409', async () => {
      await request(app).post('/api/users').send({ user: validUser });
      const res = await request(app)
        .post('/api/users')
        .send({ user: { ...validUser, email: 'different@example.com' } });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/users').send({ user: validUser });
    });

    it('logs in with valid credentials and returns a token', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: validUser.email, password: validUser.password } });
      expect(res.status).toBe(200);
      expect(typeof (res.body as UserBody).user.token).toBe('string');
    });

    it('rejects a wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: validUser.email, password: 'wrong-password' } });
      expect(res.status).toBe(401);
    });

    it('rejects an unknown email with 401', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'ghost@example.com', password: 'password123' } });
      expect(res.status).toBe(401);
    });

    it('rejects a malformed body with 422', async () => {
      const res = await request(app).post('/api/users/login').send({ user: { email: 'x' } });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/user (current user)', () => {
    let token: string;
    beforeEach(async () => {
      const res = await request(app).post('/api/users').send({ user: validUser });
      token = (res.body as UserBody).user.token;
    });

    it('returns the current user for a valid token', async () => {
      const res = await request(app).get('/api/user').set('Authorization', `Token ${token}`);
      expect(res.status).toBe(200);
      expect((res.body as UserBody).user.username).toBe('jane');
    });

    it('also accepts the Bearer scheme', async () => {
      const res = await request(app).get('/api/user').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without an Authorization header', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request(app).get('/api/user').set('Authorization', 'Token garbage');
      expect(res.status).toBe(401);
    });

    it('returns 401 for an unsupported auth scheme', async () => {
      const res = await request(app).get('/api/user').set('Authorization', `Basic ${token}`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user (update)', () => {
    let token: string;
    beforeEach(async () => {
      const res = await request(app).post('/api/users').send({ user: validUser });
      token = (res.body as UserBody).user.token;
    });

    it('updates email and bio and reflects the change', async () => {
      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({ user: { email: 'updated@example.com', bio: 'I write code' } });
      expect(res.status).toBe(200);
      const body = res.body as UserBody;
      expect(body.user.email).toBe('updated@example.com');
      expect(body.user.bio).toBe('I write code');
    });

    it('updates the password so the user can log in with the new one', async () => {
      await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({ user: { password: 'a-fresh-password' } });
      const ok = await request(app)
        .post('/api/users/login')
        .send({ user: { email: validUser.email, password: 'a-fresh-password' } });
      expect(ok.status).toBe(200);
    });

    it('returns 409 when changing email to one already taken', async () => {
      await request(app)
        .post('/api/users')
        .send({ user: { username: 'bob', email: 'bob@example.com', password: 'password123' } });
      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({ user: { email: 'bob@example.com' } });
      expect(res.status).toBe(409);
    });

    it('returns 422 for an empty update body', async () => {
      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({ user: {} });
      expect(res.status).toBe(422);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).put('/api/user').send({ user: { bio: 'x' } });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('reports ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect((res.body as { status: string }).status).toBe('ok');
    });
  });
});
