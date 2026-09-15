import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/prisma';

const app = createApp();

describe('Articles Integration Tests', () => {
  const prefix = `art_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const authorData = {
    username: `${prefix}_author`,
    email: `${prefix}_author@example.com`,
    password: 'password123'
  };
  const readerData = {
    username: `${prefix}_reader`,
    email: `${prefix}_reader@example.com`,
    password: 'password123'
  };

  let authorToken: string;
  let readerToken: string;
  let createdSlug: string;

  beforeAll(async () => {
    //
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: prefix } }
      });
    } catch {
      //
    }
  });

  it('sets up author and reader users', async () => {
    const res1 = await request(app)
      .post('/api/users')
      .send({ user: authorData });
    expect(res1.status).toBe(201);
    authorToken = res1.body.user.token;

    const res2 = await request(app)
      .post('/api/users')
      .send({ user: readerData });
    expect(res2.status).toBe(201);
    readerToken = res2.body.user.token;
  });

  it('POST /api/articles - requires authentication', async () => {
    const res = await request(app)
      .post('/api/articles')
      .send({
        article: {
          title: 'Unauthorized Article',
          description: 'Desc',
          body: 'Body'
        }
      });
    expect(res.status).toBe(401);
  });

  it('POST /api/articles - creates article with tags and body present', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: `${prefix} Test Article`,
          description: 'Test description',
          body: 'Detailed full text body',
          tagList: ['integration', 'test']
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.article).toHaveProperty('slug');
    expect(res.body.article.title).toBe(`${prefix} Test Article`);
    expect(res.body.article.body).toBe('Detailed full text body');
    expect(res.body.article.tagList).toContain('integration');
    createdSlug = res.body.article.slug;
  });

  it('GET /api/articles - lists articles WITHOUT body field', async () => {
    const res = await request(app).get('/api/articles');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('articles');
    expect(res.body).toHaveProperty('articlesCount');
    expect(Array.isArray(res.body.articles)).toBe(true);

    const target = res.body.articles.find((a: any) => a.slug === createdSlug);
    if (target) {
      expect(target.body).toBeUndefined();
    }
  });

  it('GET /api/articles/:slug - retrieves single article WITH body field', async () => {
    const res = await request(app).get(`/api/articles/${createdSlug}`);

    expect(res.status).toBe(200);
    expect(res.body.article.slug).toBe(createdSlug);
    expect(res.body.article.body).toBe('Detailed full text body');
  });

  it('PUT /api/articles/:slug - rejects update from non-author', async () => {
    const res = await request(app)
      .put(`/api/articles/${createdSlug}`)
      .set('Authorization', `Token ${readerToken}`)
      .send({
        article: {
          description: 'Hijacked description'
        }
      });

    expect(res.status).toBe(403);
  });

  it('PUT /api/articles/:slug - updates article when called by author', async () => {
    const res = await request(app)
      .put(`/api/articles/${createdSlug}`)
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          description: 'Updated test description'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.article.description).toBe('Updated test description');
  });

  it('POST /api/articles/:slug/favorite - favorites the article', async () => {
    const res = await request(app)
      .post(`/api/articles/${createdSlug}/favorite`)
      .set('Authorization', `Token ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(true);
    expect(res.body.article.favoritesCount).toBe(1);
  });

  it('DELETE /api/articles/:slug/favorite - unfavorites the article', async () => {
    const res = await request(app)
      .delete(`/api/articles/${createdSlug}/favorite`)
      .set('Authorization', `Token ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(false);
    expect(res.body.article.favoritesCount).toBe(0);
  });

  it('GET /api/articles/feed - returns feed for followed authors without body', async () => {
    // Follow the author
    await request(app)
      .post(`/api/profiles/${authorData.username}/follow`)
      .set('Authorization', `Token ${readerToken}`);

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('articles');
    expect(res.body.articles.length).toBeGreaterThanOrEqual(1);
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it('DELETE /api/articles/:slug - rejects delete from non-author', async () => {
    const res = await request(app)
      .delete(`/api/articles/${createdSlug}`)
      .set('Authorization', `Token ${readerToken}`);

    expect(res.status).toBe(403);
  });

  it('DELETE /api/articles/:slug - deletes article when called by author', async () => {
    const res = await request(app)
      .delete(`/api/articles/${createdSlug}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/articles/${createdSlug}`);
    expect(getRes.status).toBe(404);
  });
});
