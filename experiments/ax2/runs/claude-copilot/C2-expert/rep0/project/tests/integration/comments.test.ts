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

async function createArticleSlug(token: string): Promise<string> {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({
      article: {
        title: 'Commentable Article',
        description: 'desc',
        body: 'body',
        tagList: []
      }
    });
  return response.body.article.slug;
}

describe('GET /api/articles/:slug/comments', () => {
  it('lists comments for an article when unauthenticated', async () => {
    const author = await registerUser(app);
    const slug = await createArticleSlug(author.token);
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'First!' } });
    const response = await request(app).get(
      `/api/articles/${slug}/comments`
    );
    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].author.username).toBe(author.username);
  });

  it('returns 404 when listing comments for a non-existent article', async () => {
    const response = await request(app).get(
      '/api/articles/missing/comments'
    );
    expect(response.status).toBe(404);
  });
});

describe('POST /api/articles/:slug/comments', () => {
  it('adds a comment authored by the current user', async () => {
    const author = await registerUser(app);
    const slug = await createArticleSlug(author.token);
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'Nice post' } });
    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe('Nice post');
    expect(response.body.comment.author.username).toBe(author.username);
  });

  it('returns 401 when adding a comment without authentication', async () => {
    const author = await registerUser(app);
    const slug = await createArticleSlug(author.token);
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: 'anon' } });
    expect(response.status).toBe(401);
  });

  it('returns 404 when commenting on a non-existent article', async () => {
    const author = await registerUser(app);
    const response = await request(app)
      .post('/api/articles/missing/comments')
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'hi' } });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/articles/:slug/comments/:id', () => {
  it('deletes a comment owned by the current user', async () => {
    const author = await registerUser(app);
    const slug = await createArticleSlug(author.token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'to delete' } });
    const commentId = created.body.comment.id as number;
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', authHeader(author.token));
    expect(response.status).toBe(200);
  });

  it("returns 403 when deleting another user's comment", async () => {
    const author = await registerUser(app, { username: 'author' });
    const other = await registerUser(app, { username: 'other' });
    const slug = await createArticleSlug(author.token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'mine' } });
    const commentId = created.body.comment.id as number;
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', authHeader(other.token));
    expect(response.status).toBe(403);
  });
});
