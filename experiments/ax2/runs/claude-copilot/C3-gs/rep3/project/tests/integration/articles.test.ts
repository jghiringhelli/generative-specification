import request from 'supertest';
import { Application } from 'express';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser, RegisteredUser } from '../builders/userBuilder';

async function createArticle(
  app: Application,
  user: RegisteredUser,
  overrides: Partial<{ title: string; tagList: string[] }> = {},
): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(user.token))
    .send({
      article: {
        title: overrides.title ?? 'How to Train Your Dragon',
        description: 'Ever wonder how?',
        body: 'You have to believe',
        tagList: overrides.tagList ?? ['dragons', 'training'],
      },
    });
  return res.body.article.slug;
}

describe('Article endpoints', () => {
  let harness: ReturnType<typeof buildTestHarness>;

  beforeEach(() => {
    harness = buildTestHarness();
  });

  describe('POST /api/articles', () => {
    it('creates an article for an authenticated user', async () => {
      const user = await registerUser(harness.app, { username: 'author1' });
      const res = await request(harness.app)
        .post('/api/articles')
        .set('Authorization', authHeader(user.token))
        .send({
          article: {
            title: 'My First Article',
            description: 'desc',
            body: 'body text',
            tagList: ['intro'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.article.slug).toContain('my-first-article');
      expect(res.body.article.body).toBe('body text');
      expect(res.body.article.author.username).toBe('author1');
      expect(res.body.article.tagList).toEqual(['intro']);
    });

    it('returns 401 without a token', async () => {
      const res = await request(harness.app)
        .post('/api/articles')
        .send({ article: { title: 't', description: 'd', body: 'b' } });
      expect(res.status).toBe(401);
    });

    it('returns 422 for invalid input', async () => {
      const user = await registerUser(harness.app, { username: 'author2' });
      const res = await request(harness.app)
        .post('/api/articles')
        .set('Authorization', authHeader(user.token))
        .send({ article: { title: '', description: '', body: '' } });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns a single article including body', async () => {
      const user = await registerUser(harness.app, { username: 'author3' });
      const slug = await createArticle(harness.app, user);
      const res = await request(harness.app).get(`/api/articles/${slug}`);

      expect(res.status).toBe(200);
      expect(res.body.article.body).toBeDefined();
    });

    it('returns 404 for a missing slug', async () => {
      const res = await request(harness.app).get('/api/articles/nope');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/articles', () => {
    it('omits the body field in list responses', async () => {
      const user = await registerUser(harness.app, { username: 'author4' });
      await createArticle(harness.app, user);
      const res = await request(harness.app).get('/api/articles');

      expect(res.status).toBe(200);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].body).toBeUndefined();
    });

    it('filters by tag', async () => {
      const user = await registerUser(harness.app, { username: 'author5' });
      await createArticle(harness.app, user, { title: 'A', tagList: ['red'] });
      await createArticle(harness.app, user, { title: 'B', tagList: ['blue'] });

      const res = await request(harness.app).get('/api/articles?tag=red');
      expect(res.status).toBe(200);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].tagList).toContain('red');
    });

    it('filters by author', async () => {
      const a1 = await registerUser(harness.app, { username: 'writerA' });
      const a2 = await registerUser(harness.app, { username: 'writerB' });
      await createArticle(harness.app, a1, { title: 'From A' });
      await createArticle(harness.app, a2, { title: 'From B' });

      const res = await request(harness.app).get('/api/articles?author=writerA');
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].author.username).toBe('writerA');
    });

    it('paginates with limit and offset', async () => {
      const user = await registerUser(harness.app, { username: 'author6' });
      await createArticle(harness.app, user, { title: 'One' });
      await createArticle(harness.app, user, { title: 'Two' });
      await createArticle(harness.app, user, { title: 'Three' });

      const res = await request(harness.app).get('/api/articles?limit=2&offset=1');
      expect(res.body.articles).toHaveLength(2);
      expect(res.body.articlesCount).toBe(3);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('updates an article for its author', async () => {
      const user = await registerUser(harness.app, { username: 'author7' });
      const slug = await createArticle(harness.app, user);
      const res = await request(harness.app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', authHeader(user.token))
        .send({ article: { title: 'Updated Title' } });

      expect(res.status).toBe(200);
      expect(res.body.article.title).toBe('Updated Title');
    });

    it('returns 403 when a non-author updates', async () => {
      const author = await registerUser(harness.app, { username: 'author8' });
      const other = await registerUser(harness.app, { username: 'intruder' });
      const slug = await createArticle(harness.app, author);

      const res = await request(harness.app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', authHeader(other.token))
        .send({ article: { title: 'Hijack' } });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('deletes an article for its author', async () => {
      const user = await registerUser(harness.app, { username: 'author9' });
      const slug = await createArticle(harness.app, user);
      const res = await request(harness.app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', authHeader(user.token));

      expect(res.status).toBe(200);
      const check = await request(harness.app).get(`/api/articles/${slug}`);
      expect(check.status).toBe(404);
    });

    it('returns 403 when a non-author deletes', async () => {
      const author = await registerUser(harness.app, { username: 'author10' });
      const other = await registerUser(harness.app, { username: 'intruder2' });
      const slug = await createArticle(harness.app, author);
      const res = await request(harness.app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', authHeader(other.token));
      expect(res.status).toBe(403);
    });
  });

  describe('favorite / unfavorite', () => {
    it('favorites and unfavorites an article', async () => {
      const author = await registerUser(harness.app, { username: 'author11' });
      const fan = await registerUser(harness.app, { username: 'fan' });
      const slug = await createArticle(harness.app, author);

      const fav = await request(harness.app)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', authHeader(fan.token));
      expect(fav.status).toBe(200);
      expect(fav.body.article.favorited).toBe(true);
      expect(fav.body.article.favoritesCount).toBe(1);

      const unfav = await request(harness.app)
        .delete(`/api/articles/${slug}/favorite`)
        .set('Authorization', authHeader(fan.token));
      expect(unfav.body.article.favorited).toBe(false);
      expect(unfav.body.article.favoritesCount).toBe(0);
    });
  });

  describe('GET /api/articles/feed', () => {
    it('returns articles from followed authors only', async () => {
      const reader = await registerUser(harness.app, { username: 'reader' });
      const followed = await registerUser(harness.app, { username: 'followed' });
      const ignored = await registerUser(harness.app, { username: 'ignored' });
      await createArticle(harness.app, followed, { title: 'Followed Post' });
      await createArticle(harness.app, ignored, { title: 'Ignored Post' });

      await request(harness.app)
        .post('/api/profiles/followed/follow')
        .set('Authorization', authHeader(reader.token));

      const res = await request(harness.app)
        .get('/api/articles/feed')
        .set('Authorization', authHeader(reader.token));

      expect(res.status).toBe(200);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].author.username).toBe('followed');
      expect(res.body.articles[0].body).toBeUndefined();
    });

    it('returns 401 without a token', async () => {
      const res = await request(harness.app).get('/api/articles/feed');
      expect(res.status).toBe(401);
    });
  });
});
