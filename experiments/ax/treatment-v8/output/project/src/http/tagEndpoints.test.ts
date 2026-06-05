/**
 * Subcutaneous integration tests for `GET /api/tags`.
 *
 * Supertest drives the REAL Express app — routing, error mapping, the
 * article → tag derivation — over the in-memory repository fakes. Tags are not
 * a separate store: the endpoint reports the distinct tags appearing on any
 * non-deleted article, so the test builds the vocabulary by authoring articles.
 * The Prisma adapter behind the same port is covered separately against a real
 * database.
 *
 * @gs-links: docs/specs/tags.md, docs/use-cases.md
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

interface TagsBody {
  tags: string[];
}

interface UserBody {
  user: { token: string };
}

interface ArticleBody {
  article: { slug: string };
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

/** Author an article with the given tags and return its slug. */
async function createArticle(
  app: Express,
  token: string,
  title: string,
  tagList: string[],
): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article: { title, description: 'desc', body: 'body', tagList } });
  return (res.body as ArticleBody).article.slug;
}

describe('GET /api/tags', () => {
  let app: Express;
  let token: string;
  beforeEach(async () => {
    app = buildApp();
    token = await register(app, 'jane');
  });

  it('returns an empty list when no articles exist', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect((res.body as TagsBody).tags).toEqual([]);
  });

  it('requires no authentication', async () => {
    await createArticle(app, token, 'Dragons', ['dragons']);
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect((res.body as TagsBody).tags).toEqual(['dragons']);
  });

  it('returns the distinct, de-duplicated union of tags across articles, sorted', async () => {
    await createArticle(app, token, 'First', ['dragons', 'training']);
    await createArticle(app, token, 'Second', ['training', 'angularjs']);
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect((res.body as TagsBody).tags).toEqual(['angularjs', 'dragons', 'training']);
  });

  it('omits a tag once its only article is deleted', async () => {
    const keepSlug = await createArticle(app, token, 'Kept', ['kept', 'shared']);
    const dropSlug = await createArticle(app, token, 'Dropped', ['dropped', 'shared']);
    expect(keepSlug).toBeTruthy();

    await request(app).delete(`/api/articles/${dropSlug}`).set('Authorization', `Token ${token}`);

    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    // 'dropped' is gone (its only article was deleted); 'shared' survives on 'Kept'.
    expect((res.body as TagsBody).tags).toEqual(['kept', 'shared']);
  });
});
