import request from 'supertest';
import { createApp } from '../../src/app';
import { getPrismaClient } from '../../src/repositories/prisma.client';
import { clearDatabase } from '../helpers/db.helper';

describe('Tag Endpoints Integration', () => {
  const app = createApp();
  const prisma = getPrismaClient();

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  it('returns empty array when no tags or articles exist', async () => {
    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.tags).toBeDefined();
    expect(res.body.tags).toEqual([]);
  });

  it('returns unique list of tags after articles with tags are created', async () => {
    const userRes = await request(app)
      .post('/api/users')
      .send({ user: { username: 'tagger', email: 'tagger@example.com', password: 'password123' } });
    const token = userRes.body.user.token;

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 1',
          description: 'Desc 1',
          body: 'Body 1',
          tagList: ['react', 'redux'],
        },
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 2',
          description: 'Desc 2',
          body: 'Body 2',
          tagList: ['react', 'typescript'],
        },
      });

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(expect.arrayContaining(['react', 'redux', 'typescript']));
    expect(res.body.tags.length).toBe(3);
  });

  it('filters articles correctly by tag in GET /api/articles', async () => {
    const userRes = await request(app)
      .post('/api/users')
      .send({ user: { username: 'tagauthor', email: 'tagauthor@example.com', password: 'password123' } });
    const token = userRes.body.user.token;

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'React Deep Dive',
          description: 'React info',
          body: 'Content',
          tagList: ['react'],
        },
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Vue Deep Dive',
          description: 'Vue info',
          body: 'Content',
          tagList: ['vue'],
        },
      });

    const res = await request(app).get('/api/articles?tag=react');

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].title).toBe('React Deep Dive');
  });
});
