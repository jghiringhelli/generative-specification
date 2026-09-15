import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, authHeader, registerUser } from '../helpers/app';
import { resetDatabase, disconnectDatabase } from '../helpers/db';

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

async function createArticleWithTags(
  token: string,
  title: string,
  tagList: string[]
): Promise<void> {
  await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({
      article: { title, description: 'desc', body: 'body', tagList }
    });
}

describe('GET /api/tags', () => {
  it('returns an empty array when no articles exist', async () => {
    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual([]);
  });

  it('returns the unique set of tags after articles are created', async () => {
    const author = await registerUser(app);
    await createArticleWithTags(author.token, 'One', ['react', 'angular']);
    await createArticleWithTags(author.token, 'Two', ['react', 'vue']);
    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags.sort()).toEqual(['angular', 'react', 'vue']);
  });

  it('filters articles by a persisted tag via GET /api/articles', async () => {
    const author = await registerUser(app);
    await createArticleWithTags(author.token, 'One', ['react']);
    await createArticleWithTags(author.token, 'Two', ['vue']);
    const response = await request(app).get('/api/articles?tag=vue');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toContain('vue');
  });
});
