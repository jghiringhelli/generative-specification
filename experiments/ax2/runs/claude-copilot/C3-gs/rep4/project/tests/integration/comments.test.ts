import request from 'supertest';
import { Application } from 'express';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser } from '../helpers/api';

async function createArticle(app: Application, token: string): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({
      article: { title: 'Commentable', description: 'd', body: 'b', tagList: [] },
    });
  return res.body.article.slug as string;
}

describe('Comment endpoints', () => {
  let app: Application;

  beforeEach(() => {
    app = buildTestHarness().app;
  });

  it('POST /api/articles/:slug/comments adds a comment', async () => {
    const author = await registerUser(app, 'cauthor', 'cauthor@example.com');
    const slug = await createArticle(app, author.token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'Nice article!' } });
    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('Nice article!');
    expect(res.body.comment.author.username).toBe('cauthor');
    expect(typeof res.body.comment.id).toBe('number');
  });

  it('POST comment requires auth (401)', async () => {
    const author = await registerUser(app, 'cauthor2', 'cauthor2@example.com');
    const slug = await createArticle(app, author.token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: 'hi' } });
    expect(res.status).toBe(401);
  });

  it('POST comment validates body (422)', async () => {
    const author = await registerUser(app, 'cauthor3', 'cauthor3@example.com');
    const slug = await createArticle(app, author.token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: {} });
    expect(res.status).toBe(422);
  });

  it('POST comment on missing article returns 404', async () => {
    const author = await registerUser(app, 'cauthor4', 'cauthor4@example.com');
    const res = await request(app)
      .post('/api/articles/missing/comments')
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'hi' } });
    expect(res.status).toBe(404);
  });

  it('GET /api/articles/:slug/comments lists comments', async () => {
    const author = await registerUser(app, 'cauthor5', 'cauthor5@example.com');
    const slug = await createArticle(app, author.token);
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'first' } });
    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].body).toBe('first');
  });

  it('DELETE comment removes it (author only)', async () => {
    const author = await registerUser(app, 'cauthor6', 'cauthor6@example.com');
    const slug = await createArticle(app, author.token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'delete me' } });
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${created.body.comment.id}`)
      .set('Authorization', authHeader(author.token));
    expect(res.status).toBe(200);
    const list = await request(app).get(`/api/articles/${slug}/comments`);
    expect(list.body.comments).toHaveLength(0);
  });

  it('DELETE comment forbids non-authors (403)', async () => {
    const author = await registerUser(app, 'cauthor7', 'cauthor7@example.com');
    const other = await registerUser(app, 'cintruder', 'cintruder@example.com');
    const slug = await createArticle(app, author.token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'mine' } });
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${created.body.comment.id}`)
      .set('Authorization', authHeader(other.token));
    expect(res.status).toBe(403);
  });

  it('DELETE missing comment returns 404', async () => {
    const author = await registerUser(app, 'cauthor8', 'cauthor8@example.com');
    const slug = await createArticle(app, author.token);
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/9999`)
      .set('Authorization', authHeader(author.token));
    expect(res.status).toBe(404);
  });
});
