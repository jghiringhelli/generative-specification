import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp({ jwtSecret: 'integration-test-secret', port: 3000 });

beforeEach(async () => {
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();
});

afterAll(async () => prisma.$disconnect());

async function register() {
  return request(app).post('/api/users').send({
    user: { email: 'alice@example.com', username: 'alice', password: 'secret' },
  });
}

async function createArticle(token: string, title: string, tagList: string[]) {
  return request(app).post('/api/articles').set('Authorization', `Token ${token}`).send({
    article: { title, description: 'Description', body: 'Body', tagList },
  });
}

describe('tag endpoint', () => {
  test('returns an empty array when no articles exist', async () => {
    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual([]);
  });

  test('lists unique tags after articles are created', async () => {
    const user = await register();
    await createArticle(user.body.user.token, 'First', ['typescript', 'api']);
    await createArticle(user.body.user.token, 'Second', ['typescript', 'express']);
    const response = await request(app).get('/api/tags');
    expect(response.body.tags).toEqual(['api', 'express', 'typescript']);
  });

  test('filters articles using persisted tags', async () => {
    const user = await register();
    await createArticle(user.body.user.token, 'TypeScript', ['typescript']);
    await createArticle(user.body.user.token, 'Node', ['node']);
    const response = await request(app).get('/api/articles?tag=typescript');
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toContain('typescript');
  });
});
