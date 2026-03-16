import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Application } from 'express';
import { createApp } from '../../src/app';

describe('Comment Endpoints', () => {
  let app: Application;
  let prisma: PrismaClient;
  let user1Token: string;
  let user2Token: string;
  let articleSlug: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.userFavorite.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.articleTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
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

    // Create test article
    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Test Article',
          description: 'Test description',
          body: 'Test body'
        }
      });
    articleSlug = articleResponse.body.article.slug;
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('get_comments_for_article_with_no_comments_returns_empty_list', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      expect(response.body.comments).toEqual([]);
    });

    it('get_comments_for_article_with_comments_returns_comment_list', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Great article!'
          }
        });

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0]).toMatchObject({
        body: 'Great article!',
        author: {
          username: 'user2',
          following: false
        }
      });
      expect(response.body.comments[0].id).toBeDefined();
      expect(response.body.comments[0].createdAt).toBeDefined();
      expect(response.body.comments[0].updatedAt).toBeDefined();
    });

    it('get_comments_with_auth_shows_following_status', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'Comment'
          }
        });

      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.comments[0].author.following).toBe(true);
    });

    it('get_comments_for_nonexistent_article_returns_404', async () => {
      const response = await request(app)
        .get('/api/articles/nonexistent/comments')
        .expect(404);

      expect(response.body.errors.body).toBeDefined();
    });

    it('get_comments_returns_most_recent_first', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({ comment: { body: 'First comment' } });

      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({ comment: { body: 'Second comment' } });

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      expect(response.body.comments).toHaveLength(2);
      expect(response.body.comments[0].body).toBe('Second comment');
      expect(response.body.comments[1].body).toBe('First comment');
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('add_comment_with_valid_data_returns_201_and_comment', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'This is a great article!'
          }
        })
        .expect(201);

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
    });

    it('add_comment_without_auth_returns_401', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Anonymous comment'
          }
        })
        .expect(401);

      expect(response.body.errors.body).toBeDefined();
    });

    it('add_comment_with_empty_body_returns_422', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: ''
          }
        })
        .expect(422);

      expect(response.body.errors.body).toBeDefined();
    });

    it('add_comment_with_missing_body_returns_422', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {}
        })
        .expect(422);

      expect(response.body.errors.body).toBeDefined();
    });

    it('add_comment_to_nonexistent_article_returns_404', async () => {
      const response = await request(app)
        .post('/api/articles/nonexistent/comments')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: 'Comment'
          }
        })
        .expect(404);

      expect(response.body.errors.body).toBeDefined();
    });

    it('add_comment_persists_and_appears_in_list', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          comment: {
            body: 'Persistent comment'
          }
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].body).toBe('Persistent comment');
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
      await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      expect(response.body.comments).toHaveLength(0);
    });

    it('delete_comment_by_non_author_returns_403', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user1Token}`)
        .expect(403);

      expect(response.body.errors.body[0]).toContain('author');
    });

    it('delete_comment_without_auth_returns_401', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .expect(401);

      expect(response.body.errors.body).toBeDefined();
    });

    it('delete_nonexistent_comment_returns_404', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/99999`)
        .set('Authorization', `Token ${user1Token}`)
        .expect(404);

      expect(response.body.errors.body).toBeDefined();
    });

    it('delete_comment_for_nonexistent_article_returns_404', async () => {
      const response = await request(app)
        .delete(`/api/articles/nonexistent/comments/${commentId}`)
        .set('Authorization', `Token ${user2Token}`)
        .expect(404);

      expect(response.body.errors.body).toBeDefined();
    });

    it('delete_comment_with_invalid_id_returns_422', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/invalid`)
        .set('Authorization', `Token ${user1Token}`)
        .expect(422);

      expect(response.body.errors.body).toBeDefined();
    });

    it('delete_comment_removes_from_list', async () => {
      await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      const listResponse = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      expect(listResponse.body.comments).toHaveLength(0);
    });
  });

  describe('comment cascade deletion', () => {
    it('deleting_article_deletes_associated_comments', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          comment: {
            body: 'This will be deleted with the article'
          }
        })
        .expect(201);

      await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      const commentsResponse = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(404);
    });
  });
});
