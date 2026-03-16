import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('Comment Endpoints', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Username: string;
  let user2Username: string;
  let articleSlug: string;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    const user1Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123'
        }
      });

    user1Token = user1Response.body.user.token;
    user1Username = user1Response.body.user.username;

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'janedoe',
          email: 'jane@example.com',
          password: 'password123'
        }
      });

    user2Token = user2Response.body.user.token;
    user2Username = user2Response.body.user.username;

    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Test Article',
          description: 'Test description',
          body: 'Test body',
          tagList: []
        }
      });

    articleSlug = articleResponse.body.article.slug;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('adds a comment successfully', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Great article!'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.comment).toHaveProperty('id');
      expect(response.body.comment.body).toBe('Great article!');
      expect(response.body.comment.author.username).toBe(user2Username);
      expect(response.body.comment.author.following).toBe(false);
      expect(response.body.comment).toHaveProperty('createdAt');
      expect(response.body.comment).toHaveProperty('updatedAt');
    });

    it('includes following status in comment response', async () => {
      await request(app)
        .post(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Test comment'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.comment.author.following).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Great article!'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Unauthorized');
    });

    it('returns 404 when article does not exist', async () => {
      const response = await request(app)
        .post('/api/articles/nonexistent-slug/comments')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Comment on nonexistent article'
          }
        });

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Article not found');
    });

    it('returns 422 when body is empty', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: ''
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Body is required');
    });

    it('returns 422 when body is missing', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {}
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: 'First comment'
          }
        });

      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Second comment'
          }
        });
    });

    it('returns all comments when unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
      expect(response.body.comments[0].body).toBe('Second comment');
      expect(response.body.comments[1].body).toBe('First comment');
      expect(response.body.comments[0].author.following).toBe(false);
    });

    it('returns comments with following status when authenticated', async () => {
      await request(app)
        .post(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
      
      const user2Comment = response.body.comments.find(
        (c: any) => c.author.username === user2Username
      );
      expect(user2Comment.author.following).toBe(true);
    });

    it('returns empty array when article has no comments', async () => {
      const newArticleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Article Without Comments',
            description: 'Description',
            body: 'Body'
          }
        });

      const response = await request(app)
        .get(`/api/articles/${newArticleResponse.body.article.slug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(0);
    });

    it('returns 404 when article does not exist', async () => {
      const response = await request(app)
        .get('/api/articles/nonexistent-slug/comments');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Article not found');
    });

    it('includes all required comment fields', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      const comment = response.body.comments[0];
      
      expect(comment).toHaveProperty('id');
      expect(comment).toHaveProperty('body');
      expect(comment).toHaveProperty('createdAt');
      expect(comment).toHaveProperty('updatedAt');
      expect(comment.author).toHaveProperty('username');
      expect(comment.author).toHaveProperty('bio');
      expect(comment.author).toHaveProperty('image');
      expect(comment.author).toHaveProperty('following');
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    let commentId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: 'Comment to delete'
          }
        });

      commentId = response.body.comment.id;
    });

    it('deletes own comment successfully', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);

      const getResponse = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);

      expect(getResponse.body.comments).toHaveLength(0);
    });

    it('returns 403 when trying to delete another users comment', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.errors.body).toContain(
        'Forbidden: You are not the author of this comment'
      );
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`);

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Unauthorized');
    });

    it('returns 404 when article does not exist', async () => {
      const response = await request(app)
        .delete(`/api/articles/nonexistent-slug/comments/${commentId}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Article not found');
    });

    it('returns 404 when comment does not exist', async () => {
      const fakeCommentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${fakeCommentId}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Comment not found');
    });

    it('verifies comment is actually deleted', async () => {
      await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user1Token}`);

      const deleteAgainResponse = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(deleteAgainResponse.status).toBe(404);
    });

    it('allows article author to see comments but not delete others comments', async () => {
      const user2CommentResponse = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'User2 comment on User1 article'
          }
        });

      const user2CommentId = user2CommentResponse.body.comment.id;

      const deleteResponse = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${user2CommentId}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(deleteResponse.status).toBe(403);
    });
  });
});
