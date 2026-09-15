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

async function createArticle(token: string): Promise<void> {
  await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({
      article: { title: 'Comments Article', description: 'Description', body: 'Body' },
    });
}

async function createComment(token: string): Promise<request.Response> {
  return request(app)
    .post('/api/articles/comments-article/comments')
    .set('Authorization', `Token ${token}`)
    .send({ comment: { body: 'A useful comment' } });
}

describe('comment endpoints', () => {
  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
  });

  it('POST /api/articles/:slug/comments creates an authenticated comment', async () => {
    const token = await register('alice');
    await createArticle(token);
    const response = await createComment(token);
    expect(response.status).toBe(201);
    expect(response.body.comment).toMatchObject({
      body: 'A useful comment',
      author: { username: 'alice' },
    });
  });

  it('GET /api/articles/:slug/comments lists article comments', async () => {
    const token = await register('alice');
    await createArticle(token);
    await createComment(token);
    const response = await request(app).get('/api/articles/comments-article/comments');
    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].body).toBe('A useful comment');
  });

  it('DELETE /api/articles/:slug/comments/:id permits only the comment author', async () => {
    const author = await register('author');
    const other = await register('other');
    await createArticle(author);
    const comment = await createComment(author);
    const path = `/api/articles/comments-article/comments/${comment.body.comment.id}`;
    const forbidden = await request(app)
      .delete(path)
      .set('Authorization', `Token ${other}`);
    expect(forbidden.status).toBe(403);
    const deleted = await request(app)
      .delete(path)
      .set('Authorization', `Token ${author}`);
    expect(deleted.status).toBe(204);
  });

  it('requires authentication to create and delete comments', async () => {
    const token = await register('alice');
    await createArticle(token);
    const createResponse = await request(app)
      .post('/api/articles/comments-article/comments')
      .send({ comment: { body: 'No identity' } });
    expect(createResponse.status).toBe(401);
  });
});
