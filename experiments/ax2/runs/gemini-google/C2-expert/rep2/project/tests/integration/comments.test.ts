import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Comments Endpoints Integration Tests', () => {
  const timestamp = Date.now();
  let user1Token = '';
  let user2Token = '';
  let articleSlug = '';
  let createdCommentId: number;

  const user1 = {
    username: `commuser1_${timestamp}`,
    email: `comm1_${timestamp}@example.com`,
    password: 'password123'
  };

  const user2 = {
    username: `commuser2_${timestamp}`,
    email: `comm2_${timestamp}@example.com`,
    password: 'password123'
  };

  beforeAll(async () => {
    // Register user 1
    const res1 = await request(app)
      .post('/api/users')
      .send({ user: user1 });
    user1Token = res1.body.user.token;

    // Register user 2
    const res2 = await request(app)
      .post('/api/users')
      .send({ user: user2 });
    user2Token = res2.body.user.token;

    // User 1 creates an article
    const artRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: `Commentable Article ${timestamp}`,
          description: 'Article for testing comments',
          body: 'This article is ready for discussion',
          tagList: ['discussion']
        }
      });
    articleSlug = artRes.body.article.slug;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({});
    await prisma.article.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'example.com'
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('returns 401 when adding comment without authorization', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Unauthorized comment attempt'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns 404 when adding comment to non-existent article', async () => {
      const response = await request(app)
        .post('/api/articles/non-existent-article-slug-xyz/comments')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Comment on nothing'
          }
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns 422 when comment body is empty', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: ''
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
    });

    it('creates comment successfully and returns comment object with author profile', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'This is an insightful comment from user2'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comment');
      expect(response.body.comment.body).toBe('This is an insightful comment from user2');
      expect(response.body.comment.author.username).toBe(user2.username);
      expect(response.body.comment.id).toBeDefined();

      createdCommentId = response.body.comment.id;
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('returns list of comments for article when requester is unauthenticated', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(response.body.comments.length).toBeGreaterThan(0);
      expect(response.body.comments[0].body).toBe('This is an insightful comment from user2');
    });

    it('returns 404 when listing comments for non-existent article', async () => {
      const response = await request(app).get('/api/articles/ghost-article-slug/comments');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('returns 401 when deleting comment without authorization', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${createdCommentId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns 404 when deleting comment that does not exist', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/999999`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns 403 when user attempts to delete a comment authored by another user', async () => {
      // User 1 attempts to delete User 2's comment
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${createdCommentId}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('errors');
    });

    it('successfully deletes own comment when requested by its author', async () => {
      // User 2 deletes own comment
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${createdCommentId}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);

      // Verify comment is removed from list
      const listRes = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(listRes.body.comments.find((c: { id: number }) => c.id === createdCommentId)).toBeUndefined();
    });
  });
});
