import request from 'supertest';
import { buildTestHarness } from '../helpers/testHarness';
import { authHeader, registerUser } from '../helpers/apiClient';

/**
 * Create an article via the API and return its slug.
 * @param app - The Express application.
 * @param token - The author's token.
 * @param overrides - Optional article field overrides.
 * @returns The created slug.
 */
async function createArticle(
  app: import('express').Application,
  token: string,
  overrides: Partial<{ title: string; tagList: string[] }> = {},
): Promise<string> {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({
      article: {
        title: overrides.title ?? 'How to Train Dragons',
        description: 'Ever wonder how?',
        body: 'You have to believe',
        tagList: overrides.tagList ?? ['dragons', 'training'],
      },
    });
  return response.body.article.slug;
}

describe('Article endpoints', () => {
  it('POST /api/articles creates an article', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(token))
      .send({
        article: {
          title: 'Hello World',
          description: 'greeting',
          body: 'the body',
          tagList: ['intro'],
        },
      });
    expect(response.status).toBe(201);
    expect(response.body.article.slug).toContain('hello-world');
    expect(response.body.article.body).toBe('the body');
  });

  it('POST /api/articles requires authentication', async () => {
    const { app } = buildTestHarness();
    const response = await request(app)
      .post('/api/articles')
      .send({ article: { title: 't', description: 'd', body: 'b' } });
    expect(response.status).toBe(401);
  });

  it('GET /api/articles omits the body field', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    await createArticle(app, token);
    const response = await request(app).get('/api/articles');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('GET /api/articles filters by tag', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    await createArticle(app, token, { title: 'Dragons', tagList: ['dragons'] });
    await createArticle(app, token, { title: 'Cats', tagList: ['cats'] });
    const response = await request(app).get('/api/articles').query({ tag: 'cats' });
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toContain('cats');
  });

  it('GET /api/articles paginates with limit and offset', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    await createArticle(app, token, { title: 'One' });
    await createArticle(app, token, { title: 'Two' });
    const response = await request(app).get('/api/articles').query({ limit: 1, offset: 1 });
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(2);
  });

  it('GET /api/articles/:slug returns a single article with body', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const slug = await createArticle(app, token);
    const response = await request(app).get(`/api/articles/${slug}`);
    expect(response.status).toBe(200);
    expect(response.body.article.body).toBe('You have to believe');
  });

  it('GET /api/articles/:slug returns 404 when missing', async () => {
    const { app } = buildTestHarness();
    const response = await request(app).get('/api/articles/nope');
    expect(response.status).toBe(404);
  });

  it('PUT /api/articles/:slug forbids non-authors', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app, { username: 'alice', email: 'alice@example.com' });
    const slug = await createArticle(app, token);
    const { token: otherToken } = await registerUser(app, {
      username: 'bob',
      email: 'bob@example.com',
    });
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', authHeader(otherToken))
      .send({ article: { title: 'Hijacked' } });
    expect(response.status).toBe(403);
  });

  it('DELETE /api/articles/:slug removes an owned article', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const slug = await createArticle(app, token);
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', authHeader(token));
    expect(response.status).toBe(200);
    const followUp = await request(app).get(`/api/articles/${slug}`);
    expect(followUp.status).toBe(404);
  });

  it('POST and DELETE /api/articles/:slug/favorite toggle favorite state', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const slug = await createArticle(app, token);
    const favorited = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(token));
    expect(favorited.body.article.favorited).toBe(true);
    expect(favorited.body.article.favoritesCount).toBe(1);
    const unfavorited = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(token));
    expect(unfavorited.body.article.favorited).toBe(false);
    expect(unfavorited.body.article.favoritesCount).toBe(0);
  });

  it('GET /api/articles/feed returns articles from followed authors', async () => {
    const { app } = buildTestHarness();
    const { token: authorToken } = await registerUser(app, {
      username: 'author',
      email: 'author@example.com',
    });
    await createArticle(app, authorToken, { title: 'Followed Post' });
    const { token: readerToken } = await registerUser(app, {
      username: 'reader',
      email: 'reader@example.com',
    });
    await request(app)
      .post('/api/profiles/author/follow')
      .set('Authorization', authHeader(readerToken));
    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', authHeader(readerToken));
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('GET /api/articles/feed requires authentication', async () => {
    const { app } = buildTestHarness();
    const response = await request(app).get('/api/articles/feed');
    expect(response.status).toBe(401);
  });
});
