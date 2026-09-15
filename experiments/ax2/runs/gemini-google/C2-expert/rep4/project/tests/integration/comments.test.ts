import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('Comments Endpoints Integration', () => {
  let user1Token: string;
  let user2Token: string;
  let articleSlug: string;

  beforeEach(async () => {
    // Reset test database
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Register User 1
    const user1Res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'commenter1',
          email: 'commenter1@example.com',
          password: 'password123',
        },
      });
    user1Token = user1Res.body.user.token;

    // Register User 2
    const user2Res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'commenter2',
          email: 'commenter2@example.com',
          password: 'password123',
        },
      });
    user2Token = user2Res.body.user.token;

    // Create an article by User 1
    const articleRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Article for Comments',
          description: 'Testing comments functionality',
          body: 'Content for comment tests',
        },
      });
    articleSlug = articleRes.body.article.slug;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('returns empty comments list when article has no comments and request is unauthenticated', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toBeDefined();
      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(response.body.comments.length).toBe(0);
    });

    it('returns 404 when requesting comments for non-existent article slug', async () => {
      const response = await request(app).get('/api/articles/non-existent-slug/comments');

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('creates a comment and returns 201 with comment details and author', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: 'Great article!',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.comment).toBeDefined();
      expect(response.body.comment.body).toBe('Great article!');
      expect(response.body.comment.author.username).toBe('commenter1');
      expect(response.body.comment.id).toBeDefined();
    });

    it('returns 401 when adding comment without authorization token', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Unauthorized comment',
          },
        });

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });

    it('returns 404 when adding comment to non-existent article', async () => {
      const response = await request(app)
        .post('/api/articles/non-existent-article-slug/comments')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: 'Comment on nothing',
          },
        });

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    let commentId: number;

    beforeEach(async () => {
      const commentRes = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: 'Comment to be deleted',
          },
        });
      commentId = commentRes.body.comment.id;
    });

    it('deletes comment when user is the comment author and returns 200', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);

      // Verify comment is removed
      const listResponse = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(listResponse.body.comments.length).toBe(0);
    });

    it('returns 403 when user attempts to delete another users comment', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('returns 401 when deleting comment without authorization token', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`);

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/articles/:slug/comments validation', () => {
    it('returns 422 when comment body is empty string', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: '',
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });
  });
});
