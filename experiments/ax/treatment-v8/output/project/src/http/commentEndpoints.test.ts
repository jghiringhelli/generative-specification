/**
 * Subcutaneous integration tests for the three comment endpoints.
 *
 * Supertest drives the REAL Express app — routing, optional/required auth, error
 * mapping, JWT verification, validation — over the in-memory repository fakes.
 * This exercises the full HTTP → service → persistence path without external
 * infra. The Prisma adapter behind the same port is covered separately against a
 * real database. Covers happy paths, 401/403 authorization, 404s, and validation.
 *
 * @gs-links: docs/specs/comments.md, docs/use-cases.md
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

interface CommentPayload {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { username: string; bio: string | null; image: string | null; following: boolean };
}
interface CommentBody {
  comment: CommentPayload;
}
interface CommentListBody {
  comments: CommentPayload[];
}
interface ArticleBody {
  article: { slug: string };
}
interface UserBody {
  user: { token: string };
}

function buildApp(): Express {
  const users = new InMemoryUserRepository();
  const follows = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository();
  const comments = new InMemoryCommentRepository();
  const tokens = new JwtTokenService(SECRET, '7d');
  const userService = new UserService(users, new Argon2PasswordHasher(), tokens);
  const profileService = new ProfileService(users, follows);
  const articleService = new ArticleService(articles, users, follows);
  const commentService = new CommentService(comments, articles, users, follows);
  return createApp({
    userService,
    profileService,
    articleService,
    commentService,
    tokenService: tokens,
  });
}

function auth(token: string): string {
  return `Token ${token}`;
}

async function register(app: Express, username: string): Promise<string> {
  const res = await request(app)
    .post('/api/users')
    .send({ user: { username, email: `${username}@example.com`, password: 'password123' } });
  return (res.body as UserBody).user.token;
}

async function createArticle(app: Express, token: string): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', auth(token))
    .send({
      article: {
        title: 'How To Train Your Dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        tagList: ['dragons'],
      },
    });
  return (res.body as ArticleBody).article.slug;
}

async function addComment(app: Express, slug: string, token: string, body: string): Promise<number> {
  const res = await request(app)
    .post(`/api/articles/${slug}/comments`)
    .set('Authorization', auth(token))
    .send({ comment: { body } });
  return (res.body as CommentBody).comment.id;
}

describe('Comment endpoints', () => {
  let app: Express;
  let janeToken: string;
  let bobToken: string;
  let slug: string;

  beforeEach(async () => {
    app = buildApp();
    janeToken = await register(app, 'jane');
    bobToken = await register(app, 'bob');
    slug = await createArticle(app, janeToken);
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('adds a comment (201) with the embedded author', async () => {
      const res = await request(app)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', auth(bobToken))
        .send({ comment: { body: 'Reading this on my phone' } });
      expect(res.status).toBe(201);
      const { comment } = res.body as CommentBody;
      expect(comment.body).toBe('Reading this on my phone');
      expect(comment.author.username).toBe('bob');
      expect(comment.author.following).toBe(false);
      expect(comment.id).toEqual(expect.any(Number));
    });

    it('rejects an unauthenticated comment with 401', async () => {
      const res = await request(app)
        .post(`/api/articles/${slug}/comments`)
        .send({ comment: { body: 'anon' } });
      expect(res.status).toBe(401);
    });

    it('rejects a blank body with 422 and a field error', async () => {
      const res = await request(app)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', auth(bobToken))
        .send({ comment: { body: '   ' } });
      expect(res.status).toBe(422);
      expect((res.body as { errors: Record<string, string[]> }).errors).toHaveProperty('body');
    });

    it('returns 404 when commenting on an unknown article', async () => {
      const res = await request(app)
        .post('/api/articles/ghost/comments')
        .set('Authorization', auth(bobToken))
        .send({ comment: { body: 'hi' } });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('lists comments newest first for an anonymous viewer', async () => {
      await addComment(app, slug, bobToken, 'first');
      await addComment(app, slug, janeToken, 'second');
      const res = await request(app).get(`/api/articles/${slug}/comments`);
      expect(res.status).toBe(200);
      const { comments } = res.body as CommentListBody;
      expect(comments.map((c) => c.body)).toEqual(['second', 'first']);
      expect(comments.every((c) => c.author.following === false)).toBe(true);
    });

    it('reflects the viewer’s follow edge in the embedded author', async () => {
      await addComment(app, slug, janeToken, 'by jane');
      await request(app).post('/api/profiles/jane/follow').set('Authorization', auth(bobToken));
      const res = await request(app)
        .get(`/api/articles/${slug}/comments`)
        .set('Authorization', auth(bobToken));
      expect((res.body as CommentListBody).comments[0]?.author.following).toBe(true);
    });

    it('returns 404 for an unknown article', async () => {
      const res = await request(app).get('/api/articles/ghost/comments');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('lets the author delete it, after which it is gone', async () => {
      const id = await addComment(app, slug, bobToken, 'mine to delete');
      const del = await request(app)
        .delete(`/api/articles/${slug}/comments/${id}`)
        .set('Authorization', auth(bobToken));
      expect(del.status).toBe(204);
      const list = await request(app).get(`/api/articles/${slug}/comments`);
      expect((list.body as CommentListBody).comments).toEqual([]);
    });

    it('forbids a non-author from deleting with 403', async () => {
      const id = await addComment(app, slug, bobToken, 'bob owns this');
      const res = await request(app)
        .delete(`/api/articles/${slug}/comments/${id}`)
        .set('Authorization', auth(janeToken));
      expect(res.status).toBe(403);
    });

    it('rejects an unauthenticated delete with 401', async () => {
      const id = await addComment(app, slug, bobToken, 'mine');
      const res = await request(app).delete(`/api/articles/${slug}/comments/${id}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 for an unknown comment id', async () => {
      const res = await request(app)
        .delete(`/api/articles/${slug}/comments/does-not-exist`)
        .set('Authorization', auth(bobToken));
      expect(res.status).toBe(404);
    });
  });
});
