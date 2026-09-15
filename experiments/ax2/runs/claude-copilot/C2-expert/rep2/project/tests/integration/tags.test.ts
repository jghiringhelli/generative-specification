import request from 'supertest';
import { Express } from 'express';
import {
  buildTestApp,
  resetDatabase,
  disconnectDatabase,
  registerUser,
  authHeader
} from '../helpers/db';

describe('Tag endpoints', () => {
  let app: Express;

  beforeAll(() => {
    app = buildTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('returns an empty array when no articles exist', async () => {
    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual([]);
  });

  it('returns unique tags aggregated across articles', async () => {
    const author = await registerUser(app);
    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'A', description: 'd', body: 'b', tagList: ['ai', 'ml'] } });
    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'B', description: 'd', body: 'b', tagList: ['ml', 'nlp'] } });
    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect([...response.body.tags].sort()).toEqual(['ai', 'ml', 'nlp']);
  });

  it('filters articles by a persisted tag', async () => {
    const author = await registerUser(app);
    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'Tagged', description: 'd', body: 'b', tagList: ['unique-tag'] } });
    const response = await request(app).get('/api/articles').query({ tag: 'unique-tag' });
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toContain('unique-tag');
  });
});
