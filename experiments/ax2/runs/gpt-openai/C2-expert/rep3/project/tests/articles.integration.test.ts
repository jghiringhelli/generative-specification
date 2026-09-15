import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

const alice = { username: 'alice', email: 'alice@example.com', password: 'secret' };
const bob = { username: 'bob', email: 'bob@example.com', password: 'secret' };
const article = { title: 'Hello World', description: 'Intro', body: 'Full body', tagList: ['news'] };

async function register(user: typeof alice): Promise<string> {
  const response = await request(app).post('/api/users').send({ user });
  return response.body.user.token;
}

async function createArticle(token: string, value = article): Promise<string> {
  const response = await request(app).post('/api/articles').set('Authorization', `Token ${token}`).send({ article: value });
  return response.body.article.slug;
}

beforeAll(() => { process.env.JWT_SECRET = 'integration-test-secret'; });
beforeEach(async () => {
  await prisma.favorite.deleteMany(); await prisma.articleTag.deleteMany(); await prisma.article.deleteMany();
  await prisma.tag.deleteMany(); await prisma.follow.deleteMany(); await prisma.user.deleteMany();
});
afterAll(async () => { await prisma.$disconnect(); });

describe('article endpoints', () => {
  it('lists articles without body fields', async () => {
    const token = await register(alice); await createArticle(token);
    const response = await request(app).get('/api/articles');
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('lists articles filtered by tag', async () => {
    const token = await register(alice); await createArticle(token);
    const response = await request(app).get('/api/articles?tag=news');
    expect(response.body.articlesCount).toBe(1);
  });

  it('lists articles filtered by author', async () => {
    const token = await register(alice); await createArticle(token);
    const response = await request(app).get('/api/articles?author=alice');
    expect(response.body.articles[0].author.username).toBe('alice');
  });

  it('lists articles filtered by favoriting user', async () => {
    const token = await register(alice); const slug = await createArticle(token);
    await request(app).post(`/api/articles/${slug}/favorite`).set('Authorization', `Token ${token}`);
    const response = await request(app).get('/api/articles?favorited=alice');
    expect(response.body.articlesCount).toBe(1);
  });

  it('paginates articles with limit and offset', async () => {
    const token = await register(alice);
    await createArticle(token, { ...article, title: 'First' }); await createArticle(token, { ...article, title: 'Second' });
    const response = await request(app).get('/api/articles?limit=1&offset=1');
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(2);
  });

  it('returns followed user articles in the authenticated feed without bodies', async () => {
    const aliceToken = await register(alice); const bobToken = await register(bob); await createArticle(bobToken);
    await request(app).post('/api/profiles/bob/follow').set('Authorization', `Token ${aliceToken}`);
    const response = await request(app).get('/api/articles/feed').set('Authorization', `Token ${aliceToken}`);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('gets a single article including its body', async () => {
    const token = await register(alice); const slug = await createArticle(token);
    const response = await request(app).get(`/api/articles/${slug}`);
    expect(response.body.article.body).toBe(article.body);
  });

  it('creates an article', async () => {
    const token = await register(alice);
    const response = await request(app).post('/api/articles').set('Authorization', `Token ${token}`).send({ article });
    expect(response.status).toBe(201);
    expect(response.body.article.slug).toMatch(/^hello-world-\d+$/);
  });

  it('updates an article owned by the authenticated author', async () => {
    const token = await register(alice); const slug = await createArticle(token);
    const response = await request(app).put(`/api/articles/${slug}`).set('Authorization', `Token ${token}`).send({ article: { title: 'Updated' } });
    expect(response.body.article.title).toBe('Updated');
  });

  it('deletes an article owned by the authenticated author', async () => {
    const token = await register(alice); const slug = await createArticle(token);
    const deletion = await request(app).delete(`/api/articles/${slug}`).set('Authorization', `Token ${token}`);
    expect(deletion.status).toBe(204);
    expect((await request(app).get(`/api/articles/${slug}`)).status).toBe(404);
  });
  it('returns 403 when deleting another author article', async () => {
    const aliceToken = await register(alice); const bobToken = await register(bob); const slug = await createArticle(aliceToken);
    const response = await request(app).delete(`/api/articles/${slug}`).set('Authorization', `Token ${bobToken}`);
    expect(response.status).toBe(403);
  });

  it('favorites and unfavorites an article', async () => {
    const token = await register(alice); const slug = await createArticle(token);
    const favorite = await request(app).post(`/api/articles/${slug}/favorite`).set('Authorization', `Token ${token}`);
    expect(favorite.body.article.favorited).toBe(true);
    const unfavorite = await request(app).delete(`/api/articles/${slug}/favorite`).set('Authorization', `Token ${token}`);
    expect(unfavorite.body.article.favorited).toBe(false);
  });

  it.each([
    ['get', '/api/articles/feed'], ['post', '/api/articles'], ['put', '/api/articles/example'],
    ['delete', '/api/articles/example'], ['post', '/api/articles/example/favorite'], ['delete', '/api/articles/example/favorite'],
  ] as const)('returns 401 when %s %s is requested without authentication', async (method, path) => {
    const response = await request(app)[method](path).send({ article });
    expect(response.status).toBe(401);
  });
});

