import request from 'supertest';
import { app } from '../../src/app';
import { clearDatabase, disconnectDatabase } from '../helpers/test-db';

describe('Comments endpoints', () => {
  let authorToken: string;
  let commenterToken: string;
  let otherToken: string;
  let articleSlug: string;

  beforeEach(async () => {
    await clearDatabase();

    const authorRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'author',
          email: 'author@example.com',
          password: 'password123'
        }
      });
    authorToken = authorRes.body.user.token;

    const commenterRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'commenter',
          email: 'commenter@example.com',
          password: 'password123'
        }
      });
    commenterToken = commenterRes.body.user.token;

    const otherRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'other',
          email: 'other@example.com',
          password: 'password123'
        }
      });
    otherToken = otherRes.body.user.token;

    const articleRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Article for Comments',
          description: 'Desc',
          body: 'Body'
        }
      });
    articleSlug = articleRes.body.article.slug;
  });

  afterAll(async () => {
    await clearDatabase();
    await disconnectDatabase();
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('returns empty comments array when article has no comments (unauthenticated)', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments).toEqual([]);
    });

    it('returns 404 when requesting comments for non-existent article slug', async () => {
      const response = await request(app).get('/api/articles/nonexistent-article/comments');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain("Article 'nonexistent-article' not found");
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('returns 201 with comment payload when adding a comment successfully', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${commenterToken}`)
        .send({
          comment: {
            body: 'Great insights here!'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('comment');
      expect(response.body.comment.body).toBe('Great insights here!');
      expect(response.body.comment.author.username).toBe('commenter');
      expect(response.body.comment.id).toBeDefined();
    });

    it('returns 401 when adding comment without authentication token', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Unauthorized comment'
          }
        });

      expect(response.status).toBe(401);
    });

    it('returns 404 when attempting to comment on a non-existent article', async () => {
      const response = await request(app)
        .post('/api/articles/nonexistent-slug/comments')
        .set('Authorization', `Token ${commenterToken}`)
        .send({
          comment: {
            body: 'Comment on nothing'
          }
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    let commentId: number;

    beforeEach(async () => {
      const commentRes = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${commenterToken}`)
        .send({
          comment: {
            body: 'Comment to be deleted'
          }
        });
      commentId = commentRes.body.comment.id;
    });

    it('returns 200 when deleting own comment', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${commenterToken}`);

      expect(response.status).toBe(200);

      const listRes = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(listRes.body.comments.length).toBe(0);
    });

    it('returns 403 when trying to delete another users comment', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.errors.body).toContain('You are not authorized to delete this comment');
    });

    it('returns 401 when deleting comment without authentication token', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`);

      expect(response.status).toBe(401);
    });
  });
});
