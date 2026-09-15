import request from 'supertest';
import { Application } from 'express';
import { buildTestApp, prisma, resetDatabase } from './helpers';

let app: Application;

beforeAll(() => {
  app = buildTestApp();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Registers a user and returns its auth token.
 * @param username the username to register
 * @returns the issued JWT token
 */
async function registerUser(username: string): Promise<string> {
  const res = await request(app)
    .post('/api/users')
    .send({ user: { email: `${username}@example.com`, username, password: 'password123' } });
  return res.body.user.token;
}

describe('GET /api/tags', () => {
  it('returns an empty array when no articles exist', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it('returns the unique tags across all articles after creation', async () => {
    const token = await registerUser('author');
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'A', description: 'd', body: 'b', tagList: ['react', 'node'] } });
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'B', description: 'd', body: 'b', tagList: ['node', 'express'] } });
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags.sort()).toEqual(['express', 'node', 'react']);
  });

  it('filters articles by a persisted tag through GET /api/articles', async () => {
    const token = await registerUser('author');
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Tagged', description: 'd', body: 'b', tagList: ['findme'] } });
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Other', description: 'd', body: 'b', tagList: ['nope'] } });
    const res = await request(app).get('/api/articles').query({ tag: 'findme' });
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].tagList).toContain('findme');
  });
});
