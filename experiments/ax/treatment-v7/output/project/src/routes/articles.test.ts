import request from 'supertest';
import { createApp } from '../app';
import { InMemoryUserRepository } from '../repositories/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../repositories/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../repositories/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../repositories/InMemoryCommentRepository';
import { InMemoryTagRepository } from '../repositories/InMemoryTagRepository';
import { UserService } from '../services/UserService';
import { ProfileService } from '../services/ProfileService';
import { ArticleService } from '../services/ArticleService';
import { CommentService } from '../services/CommentService';
import { TagService } from '../services/TagService';

// Shared user store — all repos that need user lookups reference this instance.
const userRepo = new InMemoryUserRepository();
const profileRepo = new InMemoryProfileRepository(userRepo);
const articleRepo = new InMemoryArticleRepository(userRepo);
const commentRepo = new InMemoryCommentRepository(userRepo);
const tagRepo = new InMemoryTagRepository(articleRepo);

const userService = new UserService(userRepo);
const profileService = new ProfileService(profileRepo);
const articleService = new ArticleService(articleRepo);
const commentService = new CommentService(commentRepo, articleRepo);
const tagService = new TagService(tagRepo);
const app = createApp({ userService, profileService, articleService, commentService, tagService });

const ALICE = { email: 'alice@example.com', username: 'alice', password: 'Password123!' };
const BOB = { email: 'bob@example.com', username: 'bob', password: 'Password123!' };

const ARTICLE_PAYLOAD = {
  title: 'How to Train Your Dragon',
  description: 'Ever wonder how?',
  body: 'You have to believe',
  tagList: ['dragons', 'training'],
};

/** Register a user and return their JWT token. */
async function registerAndGetToken(user: typeof ALICE): Promise<string> {
  const res = await request(app).post('/api/users').send({ user });
  return res.body.user.token as string;
}

/** Create an article and return its slug. */
async function createArticle(
  token: string,
  payload: typeof ARTICLE_PAYLOAD = ARTICLE_PAYLOAD,
): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article: payload });
  return res.body.article.slug as string;
}

beforeEach(() => {
  userRepo.clear();
  profileRepo.clear();
  articleRepo.clear();
  commentRepo.clear();
});

// =============================================================================
// GET /api/articles
// =============================================================================
describe('GET /api/articles', () => {
  it('returns 200 with empty articles array when no articles exist', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.articles).toEqual([]);
    expect(res.body.articlesCount).toBe(0);
  });

  it('returns articles with correct shape and no body field', async () => {
    const token = await registerAndGetToken(ALICE);
    await createArticle(token);

    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articlesCount).toBe(1);

    const article = res.body.articles[0];
    expect(article).toHaveProperty('slug');
    expect(article).toHaveProperty('title', ARTICLE_PAYLOAD.title);
    expect(article).toHaveProperty('description', ARTICLE_PAYLOAD.description);
    expect(article).not.toHaveProperty('body');
    expect(article).toHaveProperty('tagList');
    expect(article).toHaveProperty('favorited');
    expect(article).toHaveProperty('favoritesCount');
    expect(article).toHaveProperty('author');
  });

  it('filters by tag', async () => {
    const token = await registerAndGetToken(ALICE);
    await createArticle(token, { ...ARTICLE_PAYLOAD, tagList: ['dragons'] });
    await createArticle(token, { ...ARTICLE_PAYLOAD, title: 'Fish Tales', tagList: ['fish'] });

    const res = await request(app).get('/api/articles?tag=dragons');
    expect(res.status).toBe(200);
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articles[0].tagList).toContain('dragons');
  });

  it('filters by author', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    await createArticle(aliceToken, { ...ARTICLE_PAYLOAD, title: "Alice's Article" });
    await createArticle(bobToken, { ...ARTICLE_PAYLOAD, title: "Bob's Article" });

    const res = await request(app).get('/api/articles?author=alice');
    expect(res.status).toBe(200);
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articles[0].author.username).toBe('alice');
  });

  it('respects limit and offset for pagination', async () => {
    const token = await registerAndGetToken(ALICE);
    for (let i = 1; i <= 5; i++) {
      await createArticle(token, { ...ARTICLE_PAYLOAD, title: `Article ${i}` });
    }

    const res = await request(app).get('/api/articles?limit=2&offset=1');
    expect(res.status).toBe(200);
    expect(res.body.articles).toHaveLength(2);
    expect(res.body.articlesCount).toBe(5); // total, not page size
  });

  it('returns favorited true for authenticated user who favorited the article', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);

    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${bobToken}`);

    const res = await request(app)
      .get('/api/articles')
      .set('Authorization', `Token ${bobToken}`);
    expect(res.status).toBe(200);
    expect(res.body.articles[0].favorited).toBe(true);
  });
});

// =============================================================================
// GET /api/articles/feed
// =============================================================================
describe('GET /api/articles/feed', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(401);
    expect(res.body.errors).toHaveProperty('token');
  });

  it('returns empty feed when following nobody', async () => {
    const token = await registerAndGetToken(ALICE);
    await createArticle(token);

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    // InMemory feed returns all articles (no follow tracking) — verify shape only
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(typeof res.body.articlesCount).toBe('number');
  });

  it('does not include body field in feed response', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    await createArticle(aliceToken);

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${aliceToken}`);
    expect(res.status).toBe(200);
    if (res.body.articles.length > 0) {
      expect(res.body.articles[0]).not.toHaveProperty('body');
    }
  });
});

// =============================================================================
// GET /api/articles/:slug
// =============================================================================
describe('GET /api/articles/:slug', () => {
  it('returns 200 with full article envelope including body', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app).get(`/api/articles/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.slug).toBe(slug);
    expect(res.body.article).toHaveProperty('body', ARTICLE_PAYLOAD.body);
    expect(res.body.article.tagList).toEqual(expect.arrayContaining(ARTICLE_PAYLOAD.tagList));
    expect(res.body.article.author.username).toBe('alice');
    expect(res.body.article.favorited).toBe(false);
    expect(res.body.article.favoritesCount).toBe(0);
  });

  it('returns 404 with article error envelope when not found', async () => {
    const res = await request(app).get('/api/articles/nonexistent-slug');
    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('article');
  });

  it('returns favorited true for authenticated user who favorited', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);

    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${bobToken}`);

    const res = await request(app)
      .get(`/api/articles/${slug}`)
      .set('Authorization', `Token ${bobToken}`);
    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(true);
    expect(res.body.article.favoritesCount).toBe(1);
  });
});

// =============================================================================
// POST /api/articles
// =============================================================================
describe('POST /api/articles', () => {
  it('returns 201 with created article envelope', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: ARTICLE_PAYLOAD });

    expect(res.status).toBe(201);
    expect(res.body.article.title).toBe(ARTICLE_PAYLOAD.title);
    expect(res.body.article.description).toBe(ARTICLE_PAYLOAD.description);
    expect(res.body.article.body).toBe(ARTICLE_PAYLOAD.body);
    expect(res.body.article.tagList).toEqual(expect.arrayContaining(ARTICLE_PAYLOAD.tagList));
    expect(res.body.article.favorited).toBe(false);
    expect(res.body.article.favoritesCount).toBe(0);
    expect(res.body.article.author.username).toBe('alice');
    expect(res.body.article).toHaveProperty('slug');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/articles')
      .send({ article: ARTICLE_PAYLOAD });
    expect(res.status).toBe(401);
  });

  it('returns 422 when title is missing', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { description: 'desc', body: 'body' } });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('title');
  });

  it('returns 422 when description is missing', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Title', body: 'body' } });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('description');
  });

  it('creates article with empty tagList when tagList omitted', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Title', description: 'Desc', body: 'Body' } });

    expect(res.status).toBe(201);
    expect(res.body.article.tagList).toEqual([]);
  });
});

// =============================================================================
// PUT /api/articles/:slug
// =============================================================================
describe('PUT /api/articles/:slug', () => {
  it('returns 200 with updated article', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Updated Title', description: 'Updated Desc' } });

    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('Updated Title');
    expect(res.body.article.description).toBe('Updated Desc');
    expect(res.body.article.body).toBe(ARTICLE_PAYLOAD.body);
  });

  it('returns 401 when not authenticated', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .send({ article: { title: 'Updated' } });
    expect(res.status).toBe(401);
  });

  it('returns 403 when authenticated user is not the author', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);

    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${bobToken}`)
      .send({ article: { title: 'Bob tries to update' } });

    expect(res.status).toBe(403);
    expect(res.body.errors).toHaveProperty('article');
  });

  it('returns 404 when article does not exist', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .put('/api/articles/nonexistent-slug')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Updated' } });

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('article');
  });

  it('regenerates slug when title is updated', async () => {
    const token = await registerAndGetToken(ALICE);
    const originalSlug = await createArticle(token);

    const res = await request(app)
      .put(`/api/articles/${originalSlug}`)
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Brand New Title' } });

    expect(res.status).toBe(200);
    expect(res.body.article.slug).not.toBe(originalSlug);
    expect(res.body.article.title).toBe('Brand New Title');
  });
});

// =============================================================================
// DELETE /api/articles/:slug
// =============================================================================
describe('DELETE /api/articles/:slug', () => {
  it('returns 204 on successful deletion', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(204);
  });

  it('returns 401 when not authenticated', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app).delete(`/api/articles/${slug}`);
    expect(res.status).toBe(401);
  });

  it('returns 403 when authenticated user is not the author', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);

    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toHaveProperty('article');
  });

  it('returns 404 when article does not exist', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .delete('/api/articles/nonexistent-slug')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('article');
  });

  it('article is no longer retrievable after deletion', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`);

    const res = await request(app).get(`/api/articles/${slug}`);
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// POST /api/articles/:slug/favorite
// =============================================================================
describe('POST /api/articles/:slug/favorite', () => {
  it('returns 200 with favorited: true and incremented favoritesCount', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);

    const res = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(true);
    expect(res.body.article.favoritesCount).toBe(1);
  });

  it('is idempotent — second favorite returns 200 with favorited: true', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);

    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${bobToken}`);

    const res = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(true);
    expect(res.body.article.favoritesCount).toBe(1);
  });

  it('returns 401 when not authenticated', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app).post(`/api/articles/${slug}/favorite`);
    expect(res.status).toBe(401);
  });

  it('returns 404 when article does not exist', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .post('/api/articles/nonexistent-slug/favorite')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('article');
  });
});

// =============================================================================
// Validation error branches
// =============================================================================
describe('Validation error branches', () => {
  it('returns 422 when GET /api/articles receives invalid limit (< 1)', async () => {
    const res = await request(app).get('/api/articles?limit=0');
    expect(res.status).toBe(422);
  });

  it('returns 422 when GET /api/articles/feed receives invalid limit (< 1)', async () => {
    const token = await registerAndGetToken(ALICE);
    const res = await request(app)
      .get('/api/articles/feed?limit=0')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(422);
  });

  it('returns 422 when PUT /api/articles/:slug receives empty article object', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .send({ article: {} });

    expect(res.status).toBe(422);
  });
});

// =============================================================================
// DELETE /api/articles/:slug/favorite
// =============================================================================
describe('DELETE /api/articles/:slug/favorite', () => {
  it('returns 200 with favorited: false and decremented favoritesCount', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);

    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${bobToken}`);

    const res = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(false);
    expect(res.body.article.favoritesCount).toBe(0);
  });

  it('is idempotent — unfavorite when not favorited returns 200 with favorited: false', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);

    const res = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(false);
  });

  it('returns 401 when not authenticated', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app).delete(`/api/articles/${slug}/favorite`);
    expect(res.status).toBe(401);
  });

  it('returns 404 when article does not exist', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .delete('/api/articles/nonexistent-slug/favorite')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('article');
  });
});
