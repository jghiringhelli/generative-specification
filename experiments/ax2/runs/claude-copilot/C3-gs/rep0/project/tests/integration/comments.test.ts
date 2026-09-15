import request from 'supertest';
import { Express } from 'express';
import {
  buildTestHarness,
  createTestArticle,
  registerTestUser
} from '../helpers/testApp';

/**
 * Post a comment through the API.
 * @param app - The app under test.
 * @param token - The commenter's token.
 * @param slug - The article slug.
 * @param body - The comment body.
 * @returns The created comment id.
 */
async function postComment(
  app: Express,
  token: string,
  slug: string,
  body = 'Nice article!'
): Promise<number> {
  const res = await request(app)
    .post(`/api/articles/${slug}/comments`)
    .set('Authorization', `Token ${token}`)
    .send({ comment: { body } });
  return res.body.comment.id;
}

describe('POST /api/articles/:slug/comments', () => {
  it('adds a comment and returns 201', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'First!' } });
    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('First!');
    expect(res.body.comment.author.username).toBe('jane');
  });

  it('returns 401 without authentication', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: 'x' } });
    expect(res.status).toBe(401);
  });

  it('returns 422 for an empty body', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: '' } });
    expect(res.status).toBe(422);
  });

  it('returns 404 for an unknown article', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const res = await request(app)
      .post('/api/articles/ghost/comments')
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'x' } });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/articles/:slug/comments', () => {
  it('lists comments for an article', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    await postComment(app, token, slug, 'one');
    await postComment(app, token, slug, 'two');
    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments.length).toBe(2);
  });

  it('returns 404 for an unknown article', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/articles/ghost/comments');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/articles/:slug/comments/:id', () => {
  it('deletes a comment when the author requests it', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const id = await postComment(app, token, slug);
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${id}`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    const list = await request(app).get(`/api/articles/${slug}/comments`);
    expect(list.body.comments.length).toBe(0);
  });

  it('returns 403 when a non-author attempts to delete', async () => {
    const { app } = buildTestHarness();
    const { token: author } = await registerTestUser(app, {
      username: 'author',
      email: 'author@example.com'
    });
    const { token: other } = await registerTestUser(app, {
      username: 'other',
      email: 'other@example.com'
    });
    const slug = await createTestArticle(app, author);
    const id = await postComment(app, author, slug);
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${id}`)
      .set('Authorization', `Token ${other}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without authentication', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const slug = await createTestArticle(app, token);
    const id = await postComment(app, token, slug);
    const res = await request(app).delete(`/api/articles/${slug}/comments/${id}`);
    expect(res.status).toBe(401);
  });
});
