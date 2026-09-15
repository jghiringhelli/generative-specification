import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp({ jwtSecret: 'integration-test-secret', port: 3000 });

beforeEach(async () => {
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => prisma.$disconnect());

async function register(username: string) {
  return request(app).post('/api/users').send({
    user: { email: `${username}@example.com`, username, password: 'secret' },
  });
}

async function createArticle(token: string) {
  return request(app).post('/api/articles').set('Authorization', `Token ${token}`).send({
    article: { title: 'Article', description: 'Description', body: 'Body', tagList: [] },
  });
}

describe('endpoint error responses', () => {
  test('returns 422 for invalid registration input', async () => {
    const response = await request(app).post('/api/users').send({ user: { email: 'invalid' } });
    expect(response.status).toBe(422);
    expect(response.body).toEqual({ errors: { body: expect.any(Array) } });
  });

  test('returns 422 for negative article pagination', async () => {
    const response = await request(app).get('/api/articles?limit=-1');
    expect(response.status).toBe(422);
  });

  test('returns 404 when getting an article that does not exist', async () => {
    const response = await request(app).get('/api/articles/missing');
    expect(response.status).toBe(404);
  });

  test('returns 403 when updating another authors article', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const created = await createArticle(alice.body.user.token);
    const response = await request(app).put(`/api/articles/${created.body.article.slug}`)
      .set('Authorization', `Token ${bob.body.user.token}`).send({ article: { body: 'Changed' } });
    expect(response.status).toBe(403);
  });

  test('returns 404 when listing comments for an article that does not exist', async () => {
    const response = await request(app).get('/api/articles/missing/comments');
    expect(response.status).toBe(404);
  });

  test('returns 401 when deleting a comment without authentication', async () => {
    const response = await request(app).delete('/api/articles/missing/comments/1');
    expect(response.status).toBe(401);
  });
});
