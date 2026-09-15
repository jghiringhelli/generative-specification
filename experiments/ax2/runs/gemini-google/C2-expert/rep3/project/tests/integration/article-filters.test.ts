import request from 'supertest';
import { createApp } from '../../src/app';
import { getPrismaClient } from '../../src/repositories/prisma.client';
import { clearDatabase } from '../helpers/db.helper';

describe('Article Filters and Feed Integration', () => {
  const app = createApp();
  const prisma = getPrismaClient();

  let author1Token: string;
  let readerToken: string;
  let articleSlug1: string;

  beforeEach(async () => {
    await clearDatabase(prisma);

    const a1Res = await request(app)
      .post('/api/users')
      .send({ user: { username: 'alice', email: 'alice@example.com', password: 'password123' } });
    author1Token = a1Res.body.user.token;

    const rRes = await request(app)
      .post('/api/users')
      .send({ user: { username: 'reader', email: 'reader@example.com', password: 'password123' } });
    readerToken = rRes.body.user.token;

    const art1 = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author1Token}`)
      .send({
        article: {
          title: 'Typescript Patterns',
          description: 'TS Guide',
          body: 'Detailed body that must be omitted in list',
          tagList: ['typescript', 'design'],
        },
      });
    articleSlug1 = art1.body.article.slug;

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author1Token}`)
      .send({
        article: {
          title: 'Prisma with Postgres',
          description: 'Prisma Guide',
          body: 'Another detailed body',
          tagList: ['database', 'postgres'],
        },
      });
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  it('lists articles without filters and omits body in list items', async () => {
    const res = await request(app).get('/api/articles');

    expect(res.status).toBe(200);
    expect(res.body.articles).toBeDefined();
    expect(res.body.articlesCount).toBe(2);
    expect(res.body.articles[0].body).toBeUndefined();
    expect(res.body.articles[1].body).toBeUndefined();
  });

  it('filters articles by tag successfully', async () => {
    const res = await request(app).get('/api/articles?tag=typescript');

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].title).toBe('Typescript Patterns');
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it('filters articles by author username', async () => {
    const res = await request(app).get('/api/articles?author=alice');

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(2);
  });

  it('filters articles favorited by a specific username', async () => {
    await request(app)
      .post(`/api/articles/${articleSlug1}/favorite`)
      .set('Authorization', `Token ${readerToken}`);

    const res = await request(app).get('/api/articles?favorited=reader');

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].slug).toBe(articleSlug1);
  });

  it('paginates article list with limit and offset', async () => {
    const res = await request(app).get('/api/articles?limit=1&offset=1');

    expect(res.status).toBe(200);
    expect(res.body.articles.length).toBe(1);
    expect(res.body.articlesCount).toBe(2);
  });

  it('returns articles feed for followed authors only and omits body', async () => {
    // Follow alice
    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${readerToken}`);

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(2);
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it('returns 401 when fetching feed without authentication', async () => {
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(401);
  });

  it('returns 422 when pagination limit is negative', async () => {
    const res = await request(app).get('/api/articles?limit=-5');
    expect(res.status).toBe(422);
    expect(res.body.errors.body).toBeDefined();
  });
});
