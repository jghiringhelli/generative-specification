import request from 'supertest';
import { buildTestHarness } from '../support/testApp';
import { authHeader, registerUser } from '../support/apiHelpers';

/**
 * Create an article and return its slug.
 * @param app - The app.
 * @param token - Author token.
 * @returns The created article slug.
 */
async function seedArticle(app: Parameters<typeof request>[0], token: string): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({ article: { title: 'Commentable', description: 'd', body: 'b' } });
  return res.body.article.slug;
}

describe('Comment endpoints', () => {
  it('POST /api/articles/:slug/comments requires auth (401)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const slug = await seedArticle(app, author.token);

    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: 'hi' } });
    expect(res.status).toBe(401);
  });

  it('POST /api/articles/:slug/comments creates a comment (201)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app, { username: 'author' });
    const slug = await seedArticle(app, author.token);

    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'Great article' } });

    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('Great article');
    expect(res.body.comment.author.username).toBe('author');
  });

  it('POST comment validates the body (422)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const slug = await seedArticle(app, author.token);

    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: '' } });
    expect(res.status).toBe(422);
  });

  it('POST comment on missing article returns 404', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const res = await request(app)
      .post('/api/articles/missing/comments')
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'x' } });
    expect(res.status).toBe(404);
  });

  it('GET /api/articles/:slug/comments lists comments (200)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const slug = await seedArticle(app, author.token);
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'first' } });

    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
  });

  it('DELETE comment forbids non-author (403)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app, { username: 'owner' });
    const other = await registerUser(app, { username: 'intruder' });
    const slug = await seedArticle(app, author.token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'mine' } });
    const commentId = created.body.comment.id;

    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', authHeader(other.token));
    expect(res.status).toBe(403);
  });

  it('DELETE comment succeeds for the author (200)', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);
    const slug = await seedArticle(app, author.token);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', authHeader(author.token))
      .send({ comment: { body: 'mine' } });
    const commentId = created.body.comment.id;

    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', authHeader(author.token));
    expect(res.status).toBe(200);

    const list = await request(app).get(`/api/articles/${slug}/comments`);
    expect(list.body.comments).toHaveLength(0);
  });
});
