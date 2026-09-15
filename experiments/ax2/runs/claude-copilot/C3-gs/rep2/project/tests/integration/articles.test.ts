import request from 'supertest';
import { buildTestHarness } from '../support/testApp';
import { authHeader, registerUser } from '../support/apiHelpers';

/**
 * Create an article via the API.
 * @param app - The app.
 * @param token - Author's token.
 * @param overrides - Optional article field overrides.
 * @returns The supertest response.
 */
async function createArticle(
  app: Parameters<typeof request>[0],
  token: string,
  overrides: Record<string, unknown> = {},
) {
  return request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({
      article: {
        title: 'How to Train Your Dragon',
        description: 'Ever wonder how?',
        body: 'You have to believe',
        tagList: ['dragons', 'training'],
        ...overrides,
      },
    });
}

describe('Article endpoints', () => {
  it('POST /api/articles creates an article (201)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app, { username: 'author' });
    const res = await createArticle(app, author.token);

    expect(res.status).toBe(201);
    expect(res.body.article.slug).toContain('how-to-train-your-dragon');
    expect(res.body.article.body).toBe('You have to believe');
    expect(res.body.article.author.username).toBe('author');
  });

  it('POST /api/articles requires auth (401)', async () => {
    const { app } = buildTestHarness();
    const res = await request(app)
      .post('/api/articles')
      .send({ article: { title: 't', description: 'd', body: 'b' } });
    expect(res.status).toBe(401);
  });

  it('POST /api/articles validates the body (422)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: '', description: '', body: '' } });
    expect(res.status).toBe(422);
  });

  it('GET /api/articles lists without the body field (200)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    await createArticle(app, author.token);

    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it('GET /api/articles filters by tag', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    await createArticle(app, author.token, { title: 'Tagged', tagList: ['unique'] });
    await createArticle(app, author.token, { title: 'Other', tagList: ['common'] });

    const res = await request(app).get('/api/articles').query({ tag: 'unique' });
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
  });

  it('GET /api/articles paginates', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    await createArticle(app, author.token, { title: 'One' });
    await createArticle(app, author.token, { title: 'Two' });
    await createArticle(app, author.token, { title: 'Three' });

    const res = await request(app).get('/api/articles').query({ limit: 2, offset: 0 });
    expect(res.body.articles).toHaveLength(2);
    expect(res.body.articlesCount).toBe(3);
  });

  it('GET /api/articles/feed requires auth (401)', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(401);
  });

  it('GET /api/articles/feed returns followed authors only (no body)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app, { username: 'writer' });
    const reader = await registerUser(app, { username: 'reader' });
    await createArticle(app, author.token);
    await request(app)
      .post('/api/profiles/writer/follow')
      .set('Authorization', authHeader(reader.token));

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', authHeader(reader.token));

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it('GET /api/articles/:slug returns a single article with body', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const created = await createArticle(app, author.token);
    const slug = created.body.article.slug;

    const res = await request(app).get(`/api/articles/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.body).toBe('You have to believe');
  });

  it('GET /api/articles/:slug returns 404 for unknown slug', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/articles/nope');
    expect(res.status).toBe(404);
  });

  it('PUT /api/articles/:slug updates when author (200)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const created = await createArticle(app, author.token);
    const slug = created.body.article.slug;

    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'Updated Title' } });

    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('Updated Title');
  });

  it('PUT /api/articles/:slug forbids non-author (403)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app, { username: 'owner' });
    const other = await registerUser(app, { username: 'intruder' });
    const created = await createArticle(app, author.token);
    const slug = created.body.article.slug;

    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', authHeader(other.token))
      .send({ article: { title: 'Hacked' } });

    expect(res.status).toBe(403);
  });

  it('DELETE /api/articles/:slug removes when author (200)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const created = await createArticle(app, author.token);
    const slug = created.body.article.slug;

    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', authHeader(author.token));
    expect(res.status).toBe(200);

    const after = await request(app).get(`/api/articles/${slug}`);
    expect(after.status).toBe(404);
  });

  it('DELETE /api/articles/:slug forbids non-author (403)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app, { username: 'owner' });
    const other = await registerUser(app, { username: 'intruder' });
    const created = await createArticle(app, author.token);
    const slug = created.body.article.slug;

    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', authHeader(other.token));
    expect(res.status).toBe(403);
  });

  it('POST and DELETE favorite toggles favorite state and count', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app, { username: 'owner' });
    const fan = await registerUser(app, { username: 'fan' });
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
});
