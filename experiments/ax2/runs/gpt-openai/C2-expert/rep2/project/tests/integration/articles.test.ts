import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp({ jwtSecret: 'integration-test-secret', port: 3000 });

beforeEach(async () => {
  await prisma.favorite.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();
});

afterAll(async () => prisma.$disconnect());

async function register(username: string) {
  return request(app).post('/api/users').send({
    user: { email: `${username}@example.com`, username, password: 'secret' },
  });
}

async function createArticle(token: string, title = 'Hello World', tags = ['typescript']) {
  return request(app).post('/api/articles').set('Authorization', `Token ${token}`).send({
    article: { title, description: 'Description', body: 'Body', tagList: tags },
  });
}

describe('article endpoints', () => {
  test('lists articles without body fields', async () => {
    const user = await register('alice');
    await createArticle(user.body.user.token);
    const response = await request(app).get('/api/articles');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  test('lists articles filtered by tag', async () => {
    const user = await register('alice');
    await createArticle(user.body.user.token, 'Tagged', ['node']);
    const response = await request(app).get('/api/articles?tag=node');
    expect(response.body.articlesCount).toBe(1);
  });

  test('lists articles filtered by author', async () => {
    const user = await register('alice');
    await createArticle(user.body.user.token);
    const response = await request(app).get('/api/articles?author=alice');
    expect(response.body.articlesCount).toBe(1);
  });

  test('lists articles filtered by favorited user', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const article = await createArticle(alice.body.user.token);
    await request(app).post(`/api/articles/${article.body.article.slug}/favorite`)
      .set('Authorization', `Token ${bob.body.user.token}`);
    const response = await request(app).get('/api/articles?favorited=bob');
    expect(response.body.articlesCount).toBe(1);
  });

  test('paginates articles with limit and offset', async () => {
    const user = await register('alice');
    await createArticle(user.body.user.token, 'First');
    await createArticle(user.body.user.token, 'Second');
    const response = await request(app).get('/api/articles?limit=1&offset=1');
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(2);
  });

  test('returns a feed of followed authors without body fields', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    await request(app).post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${alice.body.user.token}`);
    await createArticle(bob.body.user.token);
    const response = await request(app).get('/api/articles/feed')
      .set('Authorization', `Token ${alice.body.user.token}`);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  test('gets a single article including its body', async () => {
    const user = await register('alice');
    const created = await createArticle(user.body.user.token);
    const response = await request(app).get(`/api/articles/${created.body.article.slug}`);
    expect(response.body.article.body).toBe('Body');
  });

  test('creates an article', async () => {
    const user = await register('alice');
    const response = await createArticle(user.body.user.token);
    expect(response.status).toBe(200);
    expect(response.body.article.slug).toMatch(/^hello-world-\d+$/);
  });

  test('updates an article when requested by its author', async () => {
    const user = await register('alice');
    const created = await createArticle(user.body.user.token);
    const response = await request(app).put(`/api/articles/${created.body.article.slug}`)
      .set('Authorization', `Token ${user.body.user.token}`)
      .send({ article: { description: 'Updated' } });
    expect(response.body.article.description).toBe('Updated');
  });

  test('returns 403 when deleting another authors article', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const created = await createArticle(alice.body.user.token);
    const response = await request(app).delete(`/api/articles/${created.body.article.slug}`)
      .set('Authorization', `Token ${bob.body.user.token}`);
    expect(response.status).toBe(403);
  });

  test('favorites and unfavorites an article idempotently', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const created = await createArticle(alice.body.user.token);
    const path = `/api/articles/${created.body.article.slug}/favorite`;
    const favored = await request(app).post(path).set('Authorization', `Token ${bob.body.user.token}`);
    expect(favored.body.article.favorited).toBe(true);
    const unfavored = await request(app).delete(path).set('Authorization', `Token ${bob.body.user.token}`);
    expect(unfavored.body.article.favorited).toBe(false);
  });

  test.each([
    ['GET', '/api/articles/feed'],
    ['POST', '/api/articles'],
    ['PUT', '/api/articles/example'],
    ['DELETE', '/api/articles/example'],
    ['POST', '/api/articles/example/favorite'],
    ['DELETE', '/api/articles/example/favorite'],
  ])('returns 401 for %s %s without authentication', async (method, path) => {
    const response = await request(app)[method.toLowerCase() as 'get'](path);
    expect(response.status).toBe(401);
  });
});
