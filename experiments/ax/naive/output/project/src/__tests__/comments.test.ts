import request from 'supertest';
import { app } from '../app';
import { cleanup, createUser, createArticle } from './helpers';

describe('Comments', () => {
  let articleSlug: string;
  let token: string;

  beforeEach(async () => {
    await cleanup();

    const user = await createUser({
      email: 'author@test.com',
      username: 'author',
      password: 'password123'
    });

    const article = await createArticle(user.id, {
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test',
      body: 'Body'
    });
    articleSlug = article.slug;

    const loginResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'commenter@test.com',
          username: 'commenter',
          password: 'password123'
        }
      });
    token = loginResponse.body.user.token;
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should add a comment', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: 'Great article!'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.comment).toMatchObject({
        body: 'Great article!',
        author: {
          username: 'commenter'
        }
      });
      expect(response.body.comment.id).toBeDefined();
      expect(response.body.comment.createdAt).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Great article!'
          }
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent article', async () => {
      const response = await request(app)
        .post('/api/articles/nonexistent/comments')
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: 'Comment'
          }
        });

      expect(response.status).toBe(404);
    });

    it('should reject empty body', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: ''
          }
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: 'First comment'
          }
        });

      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: 'Second comment'
          }
        });
    });

    it('should get all comments', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
      expect(response.body.comments[0].body).toBe('Second comment');
      expect(response.body.comments[1].body).toBe('First comment');
    });

    it('should work without authentication', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(response.status).toBe(200);
    });

    it('should show following status when authenticated', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.comments[0].author.following).toBe(false);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    let commentId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: 'To be deleted'
          }
        });
      commentId = createResponse.body.comment.id;
    });

    it('should delete own comment', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);

      const getResponse = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(getResponse.body.comments).toHaveLength(0);
    });

    it('should reject delete by non-author', async () => {
      const otherUserResponse = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'other@test.com',
            username: 'other',
            password: 'password123'
          }
        });
      const otherToken = otherUserResponse.body.user.token;

      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/99999`)
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
