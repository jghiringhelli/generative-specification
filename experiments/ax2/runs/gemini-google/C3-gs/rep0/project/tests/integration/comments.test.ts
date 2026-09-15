// tests/integration/comments.test.ts
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Comments Endpoints Integration Tests', () => {
  let authorToken: string;
  let commenterToken: string;
  let otherToken: string;
  const authorUser = `comauthor_${Date.now()}`;
  const commenterUser = `commenter_${Date.now()}`;
  const otherUser = `comother_${Date.now()}`;
  let articleSlug: string;
  let commentId: number;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'comments-test-secret';

    // Register author
    const resAuthor = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${authorUser}@example.com`,
          username: authorUser,
          password: 'Password123!'
        }
      });
    authorToken = resAuthor.body.user.token;

    // Register commenter
    const resCommenter = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${commenterUser}@example.com`,
          username: commenterUser,
          password: 'Password123!'
        }
      });
    commenterToken = resCommenter.body.user.token;

    // Register other user
    const resOther = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${otherUser}@example.com`,
          username: otherUser,
          password: 'Password123!'
        }
      });
    otherToken = resOther.body.user.token;

    // Create article
    const resArticle = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Article for Comments',
          description: 'Desc',
          body: 'Body content'
        }
      });
    articleSlug = resArticle.body.article.slug;
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should return 401 when posting comment unauthenticated', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Unauthenticated comment'
          }
        });

      expect(response.status).toBe(401);
    });

    it('should post comment when authenticated', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${commenterToken}`)
        .send({
          comment: {
            body: 'First insightful comment!'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.comment).toBeDefined();
      expect(response.body.comment.body).toBe('First insightful comment!');
      expect(response.body.comment.author.username).toBe(commenterUser);
      commentId = response.body.comment.id;
    });

    it('should return 422 if body is empty', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${commenterToken}`)
        .send({
          comment: {
            body: ''
          }
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('should retrieve list of comments for article', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toBeDefined();
      expect(response.body.comments.length).toBeGreaterThanOrEqual(1);
      expect(response.body.comments[0].body).toBe('First insightful comment!');
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('should return 403 when non-author attempts delete', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('should delete comment when author requests delete', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${commenterToken}`);

      expect(response.status).toBe(200);

      // Verify comment is removed
      const checkResponse = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);
      expect(checkResponse.body.comments.find((c: any) => c.id === commentId)).toBeUndefined();
    });
  });
});
