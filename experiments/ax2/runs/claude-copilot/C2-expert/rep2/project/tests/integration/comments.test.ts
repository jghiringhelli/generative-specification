import request from 'supertest';
import { Express } from 'express';
import {
  buildTestApp,
  resetDatabase,
  disconnectDatabase,
  registerUser,
  authHeader,
  RegisteredUser
} from '../helpers/db';

async function createArticle(app: Express, author: RegisteredUser): Promise<string> {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(author.token))
    .send({ article: { title: 'Commentable', description: 'd', body: 'b', tagList: [] } });
  return response.body.article.slug;
}

describe('Comment endpoints', () => {
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

  it('lists comments for an article without authentication', async () => {
    const author = await registerUser(app);
    const slug = await createArticle(app, author);
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'first!' } });
    const response = await request(app).get(`/api/articles/${slug}/comments`);
    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].author.username).toBe(author.username);
  });

  it('adds a comment to an article', async () => {
    const author = await registerUser(app);
    const slug = await createArticle(app, author);
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'nice article' } });
    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe('nice article');
  });

  it('deletes a comment authored by the current user', async () => {
    const author = await registerUser(app);
    const slug = await createArticle(app, author);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'to be deleted' } });
    const commentId = created.body.comment.id;
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', authHeader(author.token));
    expect(response.status).toBe(200);
  });

  it('returns 403 when deleting another user comment', async () => {
    const author = await registerUser(app, { username: 'author' });
    const other = await registerUser(app, { username: 'other' });
    const slug = await createArticle(app, author);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'mine' } });
    const commentId = created.body.comment.id;
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', authHeader(other.token));
    expect(response.status).toBe(403);
  });

  it('returns 401 when adding a comment without authentication', async () => {
    const author = await registerUser(app);
    const slug = await createArticle(app, author);
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
      .send({ comment: { body: 'ghost' } });
    expect(response.status).toBe(404);
  });
});
