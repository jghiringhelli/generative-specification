/**
 * Subcutaneous integration tests for the eight article endpoints.
 *
 * Supertest drives the REAL Express app — routing, optional/required auth, error
 * mapping, JWT verification, validation — over the in-memory repository fakes.
 * This exercises the full HTTP → service → persistence path without external
 * infra. The Prisma adapter behind the same port is covered separately against a
 * real database. Covers happy paths, 401/403 authorization, 404s, validation,
 * pagination, filtering, and the body-omission performance contract.
 *
 * @gs-links: docs/specs/articles.md, docs/use-cases.md
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

interface ArticleSummary {
  slug: string;
  title: string;
  description: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  body?: string;
  author: { username: string; bio: string | null; image: string | null; following: boolean };
}
interface ArticleBody {
  article: ArticleSummary;
}
interface ArticleListBody {
  articles: ArticleSummary[];
  articlesCount: number;
}
interface UserBody {
  user: { token: string };
}

function buildApp(): Express {
  const users = new InMemoryUserRepository();
  const follows = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository();
  const tokens = new JwtTokenService(SECRET, '7d');
  const comments = new InMemoryCommentRepository();
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

async function register(app: Express, username: string): Promise<string> {
  const res = await request(app)
    .post('/api/users')
    .send({ user: { username, email: `${username}@example.com`, password: 'password123' } });
  return (res.body as UserBody).user.token;
}

const draft = {
  title: 'How To Train Your Dragon',
  description: 'Ever wonder how?',
  body: 'It takes a Jacobian',
  tagList: ['dragons', 'training'],
};

function auth(token: string): string {
  return `Token ${token}`;
}

/** Create an article as the token's owner and return its slug. */
async function createArticle(
  app: Express,
  token: string,
  overrides: Partial<typeof draft> = {},
): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', auth(token))
    .send({ article: { ...draft, ...overrides } });
  return (res.body as ArticleBody).article.slug;
}

describe('Article endpoints', () => {
  let app: Express;
  let janeToken: string;
  let bobToken: string;

  beforeEach(async () => {
    app = buildApp();
    janeToken = await register(app, 'jane');
    bobToken = await register(app, 'bob');
  });

  describe('POST /api/articles', () => {
    it('creates an article (201) with a derived slug and embedded author', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', auth(janeToken))
        .send({ article: draft });
      expect(res.status).toBe(201);
      const { article } = res.body as ArticleBody;
      expect(article.slug).toBe('how-to-train-your-dragon');
      expect(article.body).toBe('It takes a Jacobian');
      expect(article.author.username).toBe('jane');
      expect(article.author.following).toBe(false);
      expect(article.favorited).toBe(false);
    });

    it('rejects an unauthenticated create with 401', async () => {
      const res = await request(app).post('/api/articles').send({ article: draft });
      expect(res.status).toBe(401);
    });

    it('rejects a blank title with 422 and a field error', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', auth(janeToken))
        .send({ article: { ...draft, title: '' } });
      expect(res.status).toBe(422);
      expect((res.body as { errors: Record<string, string[]> }).errors).toHaveProperty('title');
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns the article including its body for an anonymous viewer', async () => {
      const slug = await createArticle(app, janeToken);
      const res = await request(app).get(`/api/articles/${slug}`);
      expect(res.status).toBe(200);
      const { article } = res.body as ArticleBody;
      expect(article.body).toBe('It takes a Jacobian');
      expect(article.author.following).toBe(false);
    });

    it('returns 404 for an unknown slug', async () => {
      const res = await request(app).get('/api/articles/ghost');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('lets the author update and re-derives the slug on title change', async () => {
      const slug = await createArticle(app, janeToken);
      const res = await request(app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', auth(janeToken))
        .send({ article: { title: 'A Brand New Title' } });
      expect(res.status).toBe(200);
      expect((res.body as ArticleBody).article.slug).toBe('a-brand-new-title');
    });

    it('forbids a non-author from updating with 403', async () => {
      const slug = await createArticle(app, janeToken);
      const res = await request(app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', auth(bobToken))
        .send({ article: { title: 'Hijacked' } });
      expect(res.status).toBe(403);
    });

    it('rejects an unauthenticated update with 401', async () => {
      const slug = await createArticle(app, janeToken);
      const res = await request(app)
        .put(`/api/articles/${slug}`)
        .send({ article: { title: 'Nope' } });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('lets the author delete it, after which it 404s', async () => {
      const slug = await createArticle(app, janeToken);
      const del = await request(app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', auth(janeToken));
      expect(del.status).toBe(204);
      const get = await request(app).get(`/api/articles/${slug}`);
      expect(get.status).toBe(404);
    });

    it('forbids a non-author from deleting with 403', async () => {
      const slug = await createArticle(app, janeToken);
      const res = await request(app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', auth(bobToken));
      expect(res.status).toBe(403);
    });

    it('rejects an unauthenticated delete with 401', async () => {
      const slug = await createArticle(app, janeToken);
      const res = await request(app).delete(`/api/articles/${slug}`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST/DELETE /api/articles/:slug/favorite', () => {
    it('favorites and unfavorites, updating the count and flag', async () => {
      const slug = await createArticle(app, janeToken);
      const fav = await request(app)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', auth(bobToken));
      expect(fav.status).toBe(200);
      expect((fav.body as ArticleBody).article.favorited).toBe(true);
      expect((fav.body as ArticleBody).article.favoritesCount).toBe(1);

      const unfav = await request(app)
        .delete(`/api/articles/${slug}/favorite`)
        .set('Authorization', auth(bobToken));
      expect(unfav.status).toBe(200);
      expect((unfav.body as ArticleBody).article.favorited).toBe(false);
      expect((unfav.body as ArticleBody).article.favoritesCount).toBe(0);
    });

    it('rejects an unauthenticated favorite with 401', async () => {
      const slug = await createArticle(app, janeToken);
      const res = await request(app).post(`/api/articles/${slug}/favorite`);
      expect(res.status).toBe(401);
    });

    it('returns 404 when favoriting an unknown slug', async () => {
      const res = await request(app)
        .post('/api/articles/ghost/favorite')
        .set('Authorization', auth(bobToken));
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/articles (list)', () => {
    beforeEach(async () => {
      await createArticle(app, janeToken, { title: 'Jane One', tagList: ['react'] });
      await createArticle(app, bobToken, { title: 'Bob One', tagList: ['vue'] });
      await createArticle(app, janeToken, { title: 'Jane Two', tagList: ['react'] });
    });

    it('lists all articles newest first WITHOUT the body field', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      const body = res.body as ArticleListBody;
      expect(body.articlesCount).toBe(3);
      expect(body.articles.map((a) => a.title)).toEqual(['Jane Two', 'Bob One', 'Jane One']);
      for (const article of body.articles) {
        expect(article.body).toBeUndefined();
      }
    });

    it('filters by author', async () => {
      const res = await request(app).get('/api/articles').query({ author: 'jane' });
      expect((res.body as ArticleListBody).articles.map((a) => a.title)).toEqual([
        'Jane Two',
        'Jane One',
      ]);
    });

    it('filters by tag', async () => {
      const res = await request(app).get('/api/articles').query({ tag: 'vue' });
      expect((res.body as ArticleListBody).articles.map((a) => a.title)).toEqual(['Bob One']);
    });

    it('filters by favorited', async () => {
      await request(app)
        .post('/api/articles/bob-one/favorite')
        .set('Authorization', auth(janeToken));
      const res = await request(app).get('/api/articles').query({ favorited: 'jane' });
      expect((res.body as ArticleListBody).articles.map((a) => a.title)).toEqual(['Bob One']);
    });

    it('paginates with limit and offset while reporting the full count', async () => {
      const res = await request(app).get('/api/articles').query({ limit: 1, offset: 1 });
      const body = res.body as ArticleListBody;
      expect(body.articlesCount).toBe(3);
      expect(body.articles.map((a) => a.title)).toEqual(['Bob One']);
    });

    it('rejects a non-numeric limit with 422', async () => {
      const res = await request(app).get('/api/articles').query({ limit: 'lots' });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/articles/feed', () => {
    beforeEach(async () => {
      await createArticle(app, janeToken, { title: 'Jane One' });
      await createArticle(app, bobToken, { title: 'Bob One' });
    });

    it('requires authentication (401)', async () => {
      const res = await request(app).get('/api/articles/feed');
      expect(res.status).toBe(401);
    });

    it('returns only followed authors’ articles, body-less, with following=true', async () => {
      await request(app).post('/api/profiles/jane/follow').set('Authorization', auth(bobToken));
      const res = await request(app).get('/api/articles/feed').set('Authorization', auth(bobToken));
      expect(res.status).toBe(200);
      const body = res.body as ArticleListBody;
      expect(body.articlesCount).toBe(1);
      expect(body.articles[0]?.title).toBe('Jane One');
      expect(body.articles[0]?.body).toBeUndefined();
      expect(body.articles[0]?.author.following).toBe(true);
    });

    it('is empty for a viewer who follows no one', async () => {
      const res = await request(app).get('/api/articles/feed').set('Authorization', auth(janeToken));
      expect((res.body as ArticleListBody).articlesCount).toBe(0);
    });
  });
});
