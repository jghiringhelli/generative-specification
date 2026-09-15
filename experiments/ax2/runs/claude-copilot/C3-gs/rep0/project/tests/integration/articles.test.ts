import request from 'supertest';
import {
  buildTestHarness,
  createTestArticle,
  registerTestUser
} from '../helpers/testApp';

describe('POST /api/articles', () => {
  it('creates an article and returns 201 with a slug', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Hello World',
          description: 'desc',
          body: 'body',
          tagList: ['intro']
        }
      });
    expect(res.status).toBe(201);
    expect(res.body.article.slug).toBe('hello-world');
    expect(res.body.article.body).toBe('body');
    expect(res.body.article.author.username).toBe('jane');
    expect(res.body.article.tagList).toEqual(['intro']);
  });

  it('returns 401 without authentication', async () => {
    const { app } = buildTestHarness();
    const res = await request(app)
      .post('/api/articles')
      .send({ article: { title: 't', description: 'd', body: 'b' } });
    expect(res.status).toBe(401);
  });

  it('returns 422 for missing fields', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'only title' } });
    expect(res.status).toBe(422);
    expect(res.body.errors.body).toEqual(expect.any(Array));
  });
});

describe('GET /api/articles/:slug', () => {
  it('returns a single article with body', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const res = await request(app).get(`/api/articles/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.body).toBeDefined();
  });

  it('returns 404 for an unknown slug', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/articles/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/articles (list)', () => {
  it('omits the body field in list responses', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    await createTestArticle(app, token);
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it('filters by tag', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    await createTestArticle(app, token, { title: 'A', tagList: ['red'] });
    await createTestArticle(app, token, { title: 'B', tagList: ['blue'] });
    const res = await request(app).get('/api/articles?tag=red');
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].tagList).toContain('red');
  });

  it('filters by author', async () => {
    const { app } = buildTestHarness();
    const { token: t1 } = await registerTestUser(app, {
      username: 'alice',
      email: 'alice@example.com'
    });
    const { token: t2 } = await registerTestUser(app, {
      username: 'bob',
      email: 'bob@example.com'
    });
    await createTestArticle(app, t1, { title: 'Alice Post' });
    await createTestArticle(app, t2, { title: 'Bob Post' });
    const res = await request(app).get('/api/articles?author=alice');
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].author.username).toBe('alice');
  });

  it('paginates with limit and offset', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    await createTestArticle(app, token, { title: 'One' });
    await createTestArticle(app, token, { title: 'Two' });
    await createTestArticle(app, token, { title: 'Three' });
    const res = await request(app).get('/api/articles?limit=2&offset=1');
    expect(res.body.articles.length).toBe(2);
    expect(res.body.articlesCount).toBe(3);
  });

  it('filters by favorited', async () => {
    const { app } = buildTestHarness();
    const { token: author } = await registerTestUser(app, {
      username: 'author',
      email: 'author@example.com'
    });
    const { token: fan } = await registerTestUser(app, {
      username: 'fan',
      email: 'fan@example.com'
    });
    const slug = await createTestArticle(app, author, { title: 'Likeable' });
    await createTestArticle(app, author, { title: 'Ignored' });
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${fan}`);
    const res = await request(app).get('/api/articles?favorited=fan');
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].slug).toBe(slug);
  });
});

describe('GET /api/articles/feed', () => {
  it('returns 401 without authentication', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(401);
  });

  it('returns articles from followed authors only, without body', async () => {
    const { app } = buildTestHarness();
    const { token: author } = await registerTestUser(app, {
      username: 'author',
      email: 'author@example.com'
    });
    const { token: reader } = await registerTestUser(app, {
      username: 'reader',
      email: 'reader@example.com'
    });
    await createTestArticle(app, author, { title: 'Followed Post' });
    await request(app)
      .post('/api/profiles/author/follow')
      .set('Authorization', `Token ${reader}`);
    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${reader}`);
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].body).toBeUndefined();
  });
});

describe('PUT /api/articles/:slug', () => {
  it('updates an article when the author requests it', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Updated Title' } });
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('Updated Title');
    expect(res.body.article.slug).toBe('updated-title');
  });

  it('returns 403 when a non-author attempts to update', async () => {
    const { app } = buildTestHarness();
    const { token: author } = await registerTestUser(app, {
      username: 'author',
      email: 'author@example.com'
    });
    const { token: other } = await registerTestUser(app, {
      username: 'other',
      email: 'other@example.com'
    });
    const slug = await createTestArticle(app, author);
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${other}`)
      .send({ article: { title: 'Hijacked' } });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/articles/:slug', () => {
  it('deletes an article when the author requests it', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    const check = await request(app).get(`/api/articles/${slug}`);
    expect(check.status).toBe(404);
  });

  it('returns 403 when a non-author attempts to delete', async () => {
    const { app } = buildTestHarness();
    const { token: author } = await registerTestUser(app, {
      username: 'author',
      email: 'author@example.com'
    });
    const { token: other } = await registerTestUser(app, {
      username: 'other',
      email: 'other@example.com'
    });
    const slug = await createTestArticle(app, author);
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${other}`);
    expect(res.status).toBe(403);
  });
});

describe('Favorite endpoints', () => {
  it('favorites and unfavorites an article, updating the count', async () => {
    const { app } = buildTestHarness();
    const { token: author } = await registerTestUser(app, {
      username: 'author',
      email: 'author@example.com'
    });
    const { token: fan } = await registerTestUser(app, {
      username: 'fan',
      email: 'fan@example.com'
    });
    const slug = await createTestArticle(app, author);

    const fav = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${fan}`);
    expect(fav.status).toBe(200);
    expect(fav.body.article.favorited).toBe(true);
    expect(fav.body.article.favoritesCount).toBe(1);

    const unfav = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${fan}`);
    expect(unfav.status).toBe(200);
    expect(unfav.body.article.favorited).toBe(false);
    expect(unfav.body.article.favoritesCount).toBe(0);
  });

  it('returns 401 when favoriting without authentication', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const res = await request(app).post(`/api/articles/${slug}/favorite`);
    expect(res.status).toBe(401);
  });
});
