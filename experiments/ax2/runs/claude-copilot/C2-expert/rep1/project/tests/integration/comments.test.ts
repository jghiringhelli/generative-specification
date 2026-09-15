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

/**
 * Creates an article and returns its slug.
 * @param token the author's auth token
 * @returns the created article's slug
 */
async function createArticle(token: string): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({
      article: { title: 'Commentable', description: 'd', body: 'b', tagList: [] }
    });
  return res.body.article.slug;
}

describe('GET /api/articles/:slug/comments', () => {
  it('lists comments for an article when unauthenticated', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'Nice post' } });
    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].author.username).toBe('author');
  });

  it('returns 404 when listing comments on a non-existent article', async () => {
    const res = await request(app).get('/api/articles/missing/comments');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/articles/:slug/comments', () => {
  it('adds a comment and returns it with the author profile', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'First!' } });
    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('First!');
    expect(res.body.comment.author.username).toBe('author');
  });

  it('returns 401 when adding a comment without authentication', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: 'x' } });
    expect(res.status).toBe(401);
  });

  it('returns 404 when commenting on a non-existent article', async () => {
    const token = await registerUser('author');
    const res = await request(app)
      .post('/api/articles/missing/comments')
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'hello' } });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/articles/:slug/comments/:id', () => {
  it('deletes the comment when requested by its author', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'Delete me' } });
    const commentId = created.body.comment.id;
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    const list = await request(app).get(`/api/articles/${slug}/comments`);
    expect(list.body.comments).toHaveLength(0);
  });

  it("returns 403 when deleting another user's comment", async () => {
    const author = await registerUser('author');
    const other = await registerUser('intruder');
    const slug = await createArticle(author);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${author}`)
      .send({ comment: { body: 'Mine' } });
    const commentId = created.body.comment.id;
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${other}`);
    expect(res.status).toBe(403);
  });
});
