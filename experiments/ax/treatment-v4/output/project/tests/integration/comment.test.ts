import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Application } from 'express';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://conduit:conduit@localhost:5432/conduit_test'
    }
  }
});

describe('Comment Integration Tests', () => {
  let app: Application;
  let user1Token: string;
  let user2Token: string;
  let articleSlug: string;

  beforeAll(async () => {
    app = createApp(prisma);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');

    // Create two users
    const user1Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user1@example.com',
          username: 'user1',
          password: 'password123'
        }
      });
    user1Token = user1Response.body.user.token;

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user2@example.com',
          username: 'user2',
          password: 'password123'
        }
      });
    user2Token = user2Response.body.user.token;

    // Create an article
    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Test Article for Comments',
          description: 'An article to test comments',
          body: 'Article body content'
        }
      });
    articleSlug = articleResponse.body.article.slug;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('add_comment_with_valid_data_returns_200', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'This is a great article!'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.comment).toMatchObject({
        body: 'This is a great article!',
        author: {
          username: 'user2',
          bio: null,
          image: null,
          following: false
        }
      });
      expect(response.body.comment.id).toBeDefined();
      expect(response.body.comment.createdAt).toBeDefined();
      expect(response.body.comment.updatedAt).toBeDefined();
    });

    it('add_comment_without_auth_returns_401', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Unauthorized comment'
          }
        });

      expect(response.status).toBe(401);
    });

    it('add_comment_with_empty_body_returns_422', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: ''
          }
        });

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('cannot be empty');
    });

    it('add_comment_to_nonexistent_article_returns_404', async () => {
      const response = await request(app)
        .post('/api/articles/nonexistent-slug/comments')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Comment on nothing'
          }
        });

      expect(response.status).toBe(404);
    });

    it('add_comment_with_following_status_shows_correct_following', async () => {
      // User1 follows user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      // User2 adds comment (from perspective of user2, they don't follow themselves)
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'My comment'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.comment.author.following).toBe(false);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    beforeEach(async () => {
      // Add some comments
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

    it('get_comments_without_auth_returns_200_with_comments', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
      expect(response.body.comments[0].body).toBe('Second comment'); // Most recent first
      expect(response.body.comments[1].body).toBe('First comment');
    });

    it('get_comments_with_auth_shows_following_status', async () => {
      // User1 follows user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      const user2Comment = response.body.comments.find(
        (c: any) => c.author.username === 'user2'
      );
      expect(user2Comment.author.following).toBe(true);
    });

    it('get_comments_for_article_with_no_comments_returns_empty_array', async () => {
      // Create new article
      const newArticleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Article Without Comments',
            description: 'No comments yet',
            body: 'Body'
          }
        });

      const response = await request(app)
        .get(`/api/articles/${newArticleResponse.body.article.slug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(0);
    });

    it('get_comments_for_nonexistent_article_returns_404', async () => {
      const response = await request(app)
        .get('/api/articles/nonexistent-slug/comments');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    let commentId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Comment to delete'
          }
        });
      commentId = response.body.comment.id;
    });

    it('delete_comment_by_author_returns_200', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);
      expect(getResponse.body.comments).toHaveLength(0);
    });

    it('delete_comment_by_non_author_returns_403', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.errors.body[0]).toContain('author');
    });

    it('delete_comment_without_auth_returns_401', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`);

      expect(response.status).toBe(401);
    });

    it('delete_nonexistent_comment_returns_404', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/99999`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(404);
    });

    it('delete_comment_with_invalid_id_returns_422', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/not-a-number`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('Invalid comment ID');
    });
  });

  describe('Comment ordering and multiple comments', () => {
    it('comments_are_ordered_by_created_date_descending', async () => {
      // Add comments with slight delay to ensure different timestamps
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({ comment: { body: 'First' } });

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({ comment: { body: 'Second' } });

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({ comment: { body: 'Third' } });

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(3);
      expect(response.body.comments[0].body).toBe('Third');
      expect(response.body.comments[1].body).toBe('Second');
      expect(response.body.comments[2].body).toBe('First');
    });
  });
});
