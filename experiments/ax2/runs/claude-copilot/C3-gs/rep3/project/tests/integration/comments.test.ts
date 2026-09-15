import request from 'supertest';
import { Application } from 'express';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser, RegisteredUser } from '../builders/userBuilder';

async function createArticle(
  app: Application,
  user: RegisteredUser,
): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(user.token))
    .send({
      article: {
        title: 'Commentable Article',
        description: 'desc',
        body: 'body',
        tagList: [],
      },
    });
  return res.body.article.slug;
}

describe('Comment endpoints', () => {
  let harness: ReturnType<typeof buildTestHarness>;

  beforeEach(() => {
    harness = buildTestHarness();
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('adds a comment for an authenticated user', async () => {
      const user = await registerUser(harness.app, { username: 'commenter' });
      const slug = await createArticle(harness.app, user);

      const res = await request(harness.app)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authHeader(user.token))
        .send({ comment: { body: 'Great read!' } });

      expect(res.status).toBe(201);
      expect(res.body.comment.body).toBe('Great read!');
      expect(res.body.comment.author.username).toBe('commenter');
    });

    it('returns 401 without a token', async () => {
      const user = await registerUser(harness.app, { username: 'c2' });
      const slug = await createArticle(harness.app, user);
      const res = await request(harness.app)
        .post(`/api/articles/${slug}/comments`)
        .send({ comment: { body: 'x' } });
      expect(res.status).toBe(401);
    });

    it('returns 422 for an empty body', async () => {
      const user = await registerUser(harness.app, { username: 'c3' });
      const slug = await createArticle(harness.app, user);
      const res = await request(harness.app)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authHeader(user.token))
        .send({ comment: { body: '' } });
      expect(res.status).toBe(422);
    });

    it('returns 404 when the article is missing', async () => {
      const user = await registerUser(harness.app, { username: 'c4' });
      const res = await request(harness.app)
        .post('/api/articles/missing/comments')
        .set('Authorization', authHeader(user.token))
        .send({ comment: { body: 'hi' } });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('lists comments for an article', async () => {
      const user = await registerUser(harness.app, { username: 'c5' });
      const slug = await createArticle(harness.app, user);
      await request(harness.app)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authHeader(user.token))
        .send({ comment: { body: 'first' } });

      const res = await request(harness.app).get(`/api/articles/${slug}/comments`);
      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(1);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('deletes a comment for its author', async () => {
      const user = await registerUser(harness.app, { username: 'c6' });
      const slug = await createArticle(harness.app, user);
      const created = await request(harness.app)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authHeader(user.token))
        .send({ comment: { body: 'delete me' } });
      const id = created.body.comment.id;

      const res = await request(harness.app)
        .delete(`/api/articles/${slug}/comments/${id}`)
        .set('Authorization', authHeader(user.token));
      expect(res.status).toBe(200);
    });

    it('returns 403 when a non-author deletes', async () => {
      const author = await registerUser(harness.app, { username: 'c7' });
      const other = await registerUser(harness.app, { username: 'c8' });
      const slug = await createArticle(harness.app, author);
      const created = await request(harness.app)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authHeader(author.token))
        .send({ comment: { body: 'mine' } });
      const id = created.body.comment.id;

      const res = await request(harness.app)
        .delete(`/api/articles/${slug}/comments/${id}`)
        .set('Authorization', authHeader(other.token));
      expect(res.status).toBe(403);
    });

    it('returns 404 for a missing comment', async () => {
      const user = await registerUser(harness.app, { username: 'c9' });
      const slug = await createArticle(harness.app, user);
      const res = await request(harness.app)
        .delete(`/api/articles/${slug}/comments/9999`)
        .set('Authorization', authHeader(user.token));
      expect(res.status).toBe(404);
    });
  });
});
