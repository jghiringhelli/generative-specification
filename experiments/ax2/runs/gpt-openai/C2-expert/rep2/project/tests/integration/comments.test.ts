import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp({ jwtSecret: 'integration-test-secret', port: 3000 });

beforeEach(async () => {
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => prisma.$disconnect());

async function register(username: string) {
  return request(app).post('/api/users').send({
    user: { email: `${username}@example.com`, username, password: 'secret' },
  });
}

async function article(token: string) {
  return request(app).post('/api/articles').set('Authorization', `Token ${token}`).send({
    article: { title: 'Article', description: 'Description', body: 'Body', tagList: [] },
  });
}

async function comment(token: string, slug: string) {
  return request(app).post(`/api/articles/${slug}/comments`)
    .set('Authorization', `Token ${token}`).send({ comment: { body: 'Insightful' } });
}

describe('comment endpoints', () => {
  test('lists comments without authentication', async () => {
    const user = await register('alice');
    const createdArticle = await article(user.body.user.token);
    await comment(user.body.user.token, createdArticle.body.article.slug);
    const response = await request(app).get(`/api/articles/${createdArticle.body.article.slug}/comments`);
    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].author.following).toBe(false);
  });

  test('adds a comment to an article', async () => {
    const user = await register('alice');
    const createdArticle = await article(user.body.user.token);
    const response = await comment(user.body.user.token, createdArticle.body.article.slug);
    expect(response.status).toBe(200);
    expect(response.body.comment.body).toBe('Insightful');
  });

  test('deletes the authors own comment', async () => {
    const user = await register('alice');
    const createdArticle = await article(user.body.user.token);
    const createdComment = await comment(user.body.user.token, createdArticle.body.article.slug);
    const response = await request(app)
      .delete(`/api/articles/${createdArticle.body.article.slug}/comments/${createdComment.body.comment.id}`)
      .set('Authorization', `Token ${user.body.user.token}`);
    expect(response.status).toBe(200);
  });

  test('returns 403 when deleting another users comment', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const createdArticle = await article(alice.body.user.token);
    const createdComment = await comment(alice.body.user.token, createdArticle.body.article.slug);
    const response = await request(app)
      .delete(`/api/articles/${createdArticle.body.article.slug}/comments/${createdComment.body.comment.id}`)
      .set('Authorization', `Token ${bob.body.user.token}`);
    expect(response.status).toBe(403);
  });

  test('returns 401 when adding a comment without authentication', async () => {
    const user = await register('alice');
    const createdArticle = await article(user.body.user.token);
    const response = await request(app).post(`/api/articles/${createdArticle.body.article.slug}/comments`);
    expect(response.status).toBe(401);
  });

  test('returns 404 when commenting on a non-existent article', async () => {
    const user = await register('alice');
    const response = await comment(user.body.user.token, 'missing');
    expect(response.status).toBe(404);
  });
});
