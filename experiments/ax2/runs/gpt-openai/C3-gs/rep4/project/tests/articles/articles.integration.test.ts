import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';

const app = createApp({
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://unused',
  JWT_SECRET: 'integration-secret',
  JWT_EXPIRY: '7d',
  PORT: 3000,
  NODE_ENV: 'test',
});

async function register(username: string): Promise<string> {
  const response = await request(app).post('/api/users').send({
    user: { email: `${username}@example.com`, username, password: 'password123' },
  });
  return response.body.user.token;
}

async function createArticle(token: string, title = 'Hello World', tags = ['news']) {
  return request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article: { title, description: 'Description', body: 'Body', tagList: tags } });
}

describe('article endpoints', () => {
  beforeEach(async () => {
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
  });

  it('POST /api/articles creates an article for an authenticated user', async () => {
    const token = await register('alice');
    const response = await createArticle(token);
    expect(response.status).toBe(201);
    expect(response.body.article).toMatchObject({
      slug: 'hello-world',
      title: 'Hello World',
      body: 'Body',
      tagList: ['news'],
    });
  });

  it('GET /api/articles lists filtered and paginated articles without bodies', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    await createArticle(alice, 'First', ['typescript']);
    await createArticle(alice, 'Second', ['typescript']);
    const favoriteTarget = await createArticle(bob, 'Other', ['other']);
    await request(app)
      .post(`/api/articles/${favoriteTarget.body.article.slug}/favorite`)
      .set('Authorization', `Token ${alice}`);

    const byTag = await request(app).get('/api/articles?tag=typescript&limit=1&offset=1');
    expect(byTag.status).toBe(200);
    expect(byTag.body.articlesCount).toBe(2);
    expect(byTag.body.articles).toHaveLength(1);
    expect(byTag.body.articles[0].body).toBeUndefined();

    const byAuthor = await request(app).get('/api/articles?author=alice');
    expect(byAuthor.body.articlesCount).toBe(2);
    const byFavorite = await request(app).get('/api/articles?favorited=alice');
    expect(byFavorite.body.articles[0].title).toBe('Other');
  });

  it('GET /api/articles/feed returns followed authors articles without bodies', async () => {
    const viewer = await register('viewer');
    const alice = await register('alice');
    await createArticle(alice);
    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${viewer}`);
    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${viewer}`);
    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('GET /api/articles/:slug returns an article with its body', async () => {
    const token = await register('alice');
    await createArticle(token);
    const response = await request(app).get('/api/articles/hello-world');
    expect(response.status).toBe(200);
    expect(response.body.article.body).toBe('Body');
  });

  it('PUT /api/articles/:slug updates only an author article', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    await createArticle(alice);
    const forbidden = await request(app)
      .put('/api/articles/hello-world')
      .set('Authorization', `Token ${bob}`)
      .send({ article: { title: 'Stolen' } });
    expect(forbidden.status).toBe(403);
    const response = await request(app)
      .put('/api/articles/hello-world')
      .set('Authorization', `Token ${alice}`)
      .send({ article: { title: 'Updated Title' } });
    expect(response.status).toBe(200);
    expect(response.body.article.slug).toBe('updated-title');
  });

  it('DELETE /api/articles/:slug rejects non-authors and permits the author', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    await createArticle(alice);
    const forbidden = await request(app)
      .delete('/api/articles/hello-world')
      .set('Authorization', `Token ${bob}`);
    expect(forbidden.status).toBe(403);
    const response = await request(app)
      .delete('/api/articles/hello-world')
      .set('Authorization', `Token ${alice}`);
    expect(response.status).toBe(204);
  });

  it('POST /api/articles/:slug/favorite favorites an article', async () => {
    const alice = await register('alice');
    const viewer = await register('viewer');
    await createArticle(alice);
    const response = await request(app)
      .post('/api/articles/hello-world/favorite')
      .set('Authorization', `Token ${viewer}`);
    expect(response.status).toBe(200);
    expect(response.body.article).toMatchObject({ favorited: true, favoritesCount: 1 });
  });

  it('DELETE /api/articles/:slug/favorite removes a favorite', async () => {
    const alice = await register('alice');
    const viewer = await register('viewer');
    await createArticle(alice);
    await request(app)
      .post('/api/articles/hello-world/favorite')
      .set('Authorization', `Token ${viewer}`);
    const response = await request(app)
      .delete('/api/articles/hello-world/favorite')
      .set('Authorization', `Token ${viewer}`);
    expect(response.status).toBe(200);
    expect(response.body.article).toMatchObject({ favorited: false, favoritesCount: 0 });
  });

  it('requires authentication for protected article endpoints', async () => {
    const createResponse = await request(app).post('/api/articles').send({
      article: { title: 'No', description: 'No', body: 'No' },
    });
    const feedResponse = await request(app).get('/api/articles/feed');
    expect(createResponse.status).toBe(401);
    expect(feedResponse.status).toBe(401);
  });
});
