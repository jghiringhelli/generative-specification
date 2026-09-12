import request from 'supertest';
import app from '../index';

describe('Comments', () => {
  let authToken: string;
  let articleSlug: string;
  let commentId: number;

  beforeAll(async () => {
    const user = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'comment-test@test.com',
          username: 'commentuser',
          password: 'password123'
        }
      });
    authToken = user.body.user.token;

    const article = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authToken}`)
      .send({
        article: {
          title: 'Article for Comments',
          description: 'Test article',
          body: 'Article body'
        }
      });
    articleSlug = article.body.article.slug;
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should add a comment', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${authToken}`)
        .send({ comment: { body: 'Great article!' } });

      expect(response.status).toBe(201);
      expect(response.body.comment).toHaveProperty('id');
      expect(response.body.comment).toHaveProperty('body', 'Great article!');
      expect(response.body.comment).toHaveProperty('createdAt');
      expect(response.body.comment).toHaveProperty('updatedAt');
      expect(response.body.comment.author).toHaveProperty('username', 'commentuser');

      commentId = response.body.comment.id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({ comment: { body: 'Test' } });

      expect(response.status).toBe(401);
    });

    it('should fail with missing body', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${authToken}`)
        .send({ comment: {} });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('should get comments for an article', async () => {
      const response = await request(app).get(
        `/api/articles/${articleSlug}/comments`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(response.body.comments.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('should delete a comment', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).delete(
        `/api/articles/${articleSlug}/comments/999`
      );

      expect(response.status).toBe(401);
    });
  });
});
