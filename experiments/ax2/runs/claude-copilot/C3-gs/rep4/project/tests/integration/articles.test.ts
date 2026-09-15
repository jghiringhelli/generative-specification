import request from 'supertest';
import { Application } from 'express';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser } from '../helpers/api';

const sampleArticle = {
  article: {
    title: 'How to Train Your Dragon',
    description: 'Ever wonder how?',
    body: 'You have to believe.',
    tagList: ['dragons', 'training'],
  },
};

async function createArticle(app: Application, token: string, overrides = {}) {
  return request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({ article: { ...sampleArticle.article, ...overrides } });
}

describe('Article endpoints', () => {
  let app: Application;

  beforeEach(() => {
    app = buildTestHarness().app;
  });

  it('POST /api/articles creates an article', async () => {
    const author = await registerUser(app, 'author', 'author@example.com');
    const res = await createArticle(app, author.token);
    expect(res.status).toBe(201);
    expect(res.body.article.slug).toContain('how-to-train-your-dragon');
    expect(res.body.article.body).toBe('You have to believe.');
    expect(res.body.article.tagList.sort()).toEqual(['dragons', 'training']);
    expect(res.body.article.author.username).toBe('author');
  });

  it('POST /api/articles requires auth (401)', async () => {
    const res = await request(app).post('/api/articles').send(sampleArticle);
    expect(res.status).toBe(401);
  });

  it('POST /api/articles validates body (422)', async () => {
    const author = await registerUser(app, 'author2', 'author2@example.com');
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'only title' } });
    expect(res.status).toBe(422);
  });

  it('GET /api/articles/:slug returns a single article', async () => {
    const author = await registerUser(app, 'author3', 'author3@example.com');
    const created = await createArticle(app, author.token);
    const res = await request(app).get(`/api/articles/${created.body.article.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('How to Train Your Dragon');
  });

  it('GET /api/articles/:slug returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/articles/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('GET /api/articles omits the body field in list responses', async () => {
    const author = await registerUser(app, 'author4', 'author4@example.com');
    await createArticle(app, author.token);
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0]).not.toHaveProperty('body');
  });

  it('GET /api/articles filters by tag', async () => {
    const author = await registerUser(app, 'author5', 'author5@example.com');
    await createArticle(app, author.token, { tagList: ['unique-tag'] });
    await createArticle(app, author.token, { tagList: ['other'] });
    const res = await request(app).get('/api/articles?tag=unique-tag');
    expect(res.body.articlesCount).toBe(1);
  });

  it('GET /api/articles filters by author', async () => {
    const a = await registerUser(app, 'writerA', 'writerA@example.com');
    const b = await registerUser(app, 'writerB', 'writerB@example.com');
    await createArticle(app, a.token);
    await createArticle(app, b.token);
    const res = await request(app).get('/api/articles?author=writerA');
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].author.username).toBe('writerA');
  });

  it('GET /api/articles paginates with limit and offset', async () => {
    const author = await registerUser(app, 'author6', 'author6@example.com');
    await createArticle(app, author.token, { title: 'A' });
    await createArticle(app, author.token, { title: 'B' });
    await createArticle(app, author.token, { title: 'C' });
    const res = await request(app).get('/api/articles?limit=2&offset=1');
    expect(res.body.articlesCount).toBe(3);
    expect(res.body.articles).toHaveLength(2);
  });

  it('PUT /api/articles/:slug updates an article (author only)', async () => {
    const author = await registerUser(app, 'author7', 'author7@example.com');
    const created = await createArticle(app, author.token);
    const res = await request(app)
      .put(`/api/articles/${created.body.article.slug}`)
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'Updated Title' } });
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('Updated Title');
  });

  it('PUT /api/articles/:slug forbids non-authors (403)', async () => {
    const author = await registerUser(app, 'author8', 'author8@example.com');
    const other = await registerUser(app, 'intruder', 'intruder@example.com');
    const created = await createArticle(app, author.token);
    const res = await request(app)
      .put(`/api/articles/${created.body.article.slug}`)
      .set('Authorization', authHeader(other.token))
      .send({ article: { title: 'Hijacked' } });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/articles/:slug deletes an article (author only)', async () => {
    const author = await registerUser(app, 'author9', 'author9@example.com');
    const created = await createArticle(app, author.token);
    const res = await request(app)
      .delete(`/api/articles/${created.body.article.slug}`)
      .set('Authorization', authHeader(author.token));
    expect(res.status).toBe(200);
    const after = await request(app).get(`/api/articles/${created.body.article.slug}`);
    expect(after.status).toBe(404);
  });

  it('DELETE /api/articles/:slug forbids non-authors (403)', async () => {
    const author = await registerUser(app, 'author10', 'author10@example.com');
    const other = await registerUser(app, 'intruder2', 'intruder2@example.com');
    const created = await createArticle(app, author.token);
    const res = await request(app)
      .delete(`/api/articles/${created.body.article.slug}`)
      .set('Authorization', authHeader(other.token));
    expect(res.status).toBe(403);
  });

  it('favorite / unfavorite adjust favoritesCount and favorited flag', async () => {
    const author = await registerUser(app, 'author11', 'author11@example.com');
    const fan = await registerUser(app, 'fan', 'fan@example.com');
    const created = await createArticle(app, author.token);
    const slug = created.body.article.slug;

    const fav = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    expect(fav.status).toBe(200);
    expect(fav.body.article.favorited).toBe(true);
    expect(fav.body.article.favoritesCount).toBe(1);

    const unfav = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    expect(unfav.status).toBe(200);
    expect(unfav.body.article.favorited).toBe(false);
    expect(unfav.body.article.favoritesCount).toBe(0);
  });

  it('GET /api/articles/feed returns followed authors and omits body', async () => {
    const follower = await registerUser(app, 'follower', 'follower@example.com');
    const author = await registerUser(app, 'author12', 'author12@example.com');
    await createArticle(app, author.token);
    await request(app)
      .post('/api/profiles/author12/follow')
      .set('Authorization', authHeader(follower.token));

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', authHeader(follower.token));
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0]).not.toHaveProperty('body');
  });

  it('GET /api/articles/feed requires auth (401)', async () => {
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(401);
  });
});
