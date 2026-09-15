import request from 'supertest';
import { Application } from 'express';
import { buildTestHarness } from '../helpers/testHarness';
import { authHeader, registerUser } from '../helpers/apiClient';

/**
 * Create an article and return its slug.
 * @param app - The Express application.
 * @param token - The author's token.
 * @returns The created slug.
 */
async function createArticle(app: Application, token: string): Promise<string> {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({ article: { title: 'Post', description: 'd', body: 'b', tagList: [] } });
  return response.body.article.slug;
}

describe('Comment endpoints', () => {
  it('POST /api/articles/:slug/comments adds a comment', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const slug = await createArticle(app, token);
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(token))
      .send({ comment: { body: 'Nice article' } });
    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe('Nice article');
  });

  it('POST comment rejects empty body with 422', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const slug = await createArticle(app, token);
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(token))
      .send({ comment: { body: '' } });
    expect(response.status).toBe(422);
  });

  it('GET /api/articles/:slug/comments lists comments', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const slug = await createArticle(app, token);
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(token))
      .send({ comment: { body: 'First' } });
    const response = await request(app).get(`/api/articles/${slug}/comments`);
    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
  });

  it('DELETE comment forbids non-authors with 403', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app, { username: 'alice', email: 'alice@example.com' });
    const slug = await createArticle(app, token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(token))
      .send({ comment: { body: 'Mine' } });
    const { token: otherToken } = await registerUser(app, {
      username: 'bob',
      email: 'bob@example.com',
    });
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${created.body.comment.id}`)
      .set('Authorization', authHeader(otherToken));
    expect(response.status).toBe(403);
  });

  it('DELETE comment removes an owned comment', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const slug = await createArticle(app, token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(token))
      .send({ comment: { body: 'Mine' } });
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${created.body.comment.id}`)
      .set('Authorization', authHeader(token));
    expect(response.status).toBe(200);
    const list = await request(app).get(`/api/articles/${slug}/comments`);
    expect(list.body.comments).toHaveLength(0);
  });

  it('DELETE comment returns 404 for a missing comment', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    const slug = await createArticle(app, token);
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/9999`)
      .set('Authorization', authHeader(token));
    expect(response.status).toBe(404);
  });
});
