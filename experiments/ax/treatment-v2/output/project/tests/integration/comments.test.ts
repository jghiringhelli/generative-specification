import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, prisma } from '../helpers/testDb';

describe('Comments API', () => {
  let app: Application;
  let jakeToken: string;
  let janeToken: string;
  let articleSlug: string;

  beforeAll(() => {
    app = createApp(prisma);
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create test users
    const jakeResponse = await request(app).post('/api/users').send({
      user: {
        email: 'jake@jake.jake',
        username: 'jake',
        password: 'jakejake',
      },
    });
    jakeToken = jakeResponse.body.user.token;

    const janeResponse = await request(app).post('/api/users').send({
      user: {
        email: 'jane@jane.jane',
        username: 'jane',
        password: 'janejane',
      },
    });
    janeToken = janeResponse.body.user.token;

    // Create test article
    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${jakeToken}`)
      .send({
        article: {
          title: 'How to train your dragon',
          description: 'Ever wonder how?',
          body: 'It takes a Jacobian',
          tagList: ['dragons', 'training'],
        },
      });
    articleSlug = articleResponse.body.article.slug;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('addComment_with_valid_data_returns_201_and_comment', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${janeToken}`)
        .send({
          comment: {
            body: 'His name was my name too.',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.comment).toMatchObject({
        body: 'His name was my name too.',
        author: {
          username: 'jane',
          bio: null,
          image: null,
          following: false,
        },
      });
      expect(response.body.comment.id).toBeDefined();
      expect(response.body.comment.createdAt).toBeDefined();
      expect(response.body.comment.updatedAt).toBeDefined();
    });

    it('addComment_without_auth_returns_401', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Test comment',
          },
        });

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('missing authorization header');
    });

    it('addComment_with_missing_body_returns_422', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${janeToken}`)
        .send({
          comment: {},
        });

      expect(response.status).toBe(422);
    });

    it('addComment_to_nonexistent_article_returns_404', async () => {
      const response = await request(app)
        .post('/api/articles/nonexistent-article/comments')
        .set('Authorization', `Token ${janeToken}`)
        .send({
          comment: {
            body: 'Test comment',
          },
        });

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Article not found');
    });

    it('addComment_includes_author_following_status', async () => {
      // Jane follows jake (article author)
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      // Jake comments on his own article (from jane's perspective, jane follows jake)
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          comment: {
            body: 'Thanks everyone!',
          },
        });

      expect(response.status).toBe(201);
      // Jake is commenting, so following status relative to jake (himself) is false
      expect(response.body.comment.author.following).toBe(false);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    beforeEach(async () => {
      // Create some comments
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          comment: {
            body: 'First comment',
          },
        });

      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${janeToken}`)
        .send({
          comment: {
            body: 'Second comment',
          },
        });
    });

    it('getComments_returns_200_and_all_comments', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
      // Most recent first
      expect(response.body.comments[0].body).toBe('Second comment');
      expect(response.body.comments[1].body).toBe('First comment');
    });

    it('getComments_includes_author_profile', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.body.comments[0].author).toMatchObject({
        username: 'jane',
        bio: null,
        image: null,
        following: false,
      });
    });

    it('getComments_with_auth_shows_following_status', async () => {
      // Jake follows jane
      await request(app)
        .post('/api/profiles/jane/follow')
        .set('Authorization', `Token ${jakeToken}`);

      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${jakeToken}`);

      // First comment by jane - jake follows her
      expect(response.body.comments[0].author.following).toBe(true);
      // Second comment by jake himself - not following himself
      expect(response.body.comments[1].author.following).toBe(false);
    });

    it('getComments_for_article_with_no_comments_returns_empty_array', async () => {
      // Create a new article with no comments
      const newArticleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'New article',
            description: 'Test',
            body: 'Test',
          },
        });

      const response = await request(app).get(
        `/api/articles/${newArticleResponse.body.article.slug}/comments`
      );

      expect(response.status).toBe(200);
      expect(response.body.comments).toEqual([]);
    });

    it('getComments_can_be_called_without_auth', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    let commentId: number;

    beforeEach(async () => {
      const commentResponse = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${janeToken}`)
        .send({
          comment: {
            body: 'Test comment',
          },
        });
      commentId = commentResponse.body.comment.id;
    });

    it('deleteComment_by_author_returns_200', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(getResponse.body.comments).toHaveLength(0);
    });

    it('deleteComment_by_non_author_returns_403', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${jakeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.errors.body).toContain('only author can delete comment');
    });

    it('deleteComment_without_auth_returns_401', async () => {
      const response = await request(app).delete(
        `/api/articles/${articleSlug}/comments/${commentId}`
      );

      expect(response.status).toBe(401);
    });

    it('deleteComment_with_nonexistent_id_returns_404', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/99999`)
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Comment not found');
    });
  });

  describe('Comment cascade deletion', () => {
    it('deleteArticle_deletes_associated_comments', async () => {
      // Add comment to article
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${janeToken}`)
        .send({
          comment: {
            body: 'Test comment',
          },
        });

      // Verify comment exists
      let response = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(response.body.comments).toHaveLength(1);

      // Delete article
      await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${jakeToken}`);

      // Verify article is gone
      response = await request(app).get(`/api/articles/${articleSlug}`);
      expect(response.status).toBe(404);
    });
  });

  describe('Multiple comments workflow', () => {
    it('multiple_users_can_comment_on_same_article', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          comment: {
            body: 'Jake comment',
          },
        });

      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${janeToken}`)
        .send({
          comment: {
            body: 'Jane comment',
          },
        });

      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.body.comments).toHaveLength(2);
      expect(response.body.comments.map((c: any) => c.author.username).sort()).toEqual([
        'jake',
        'jane',
      ]);
    });

    it('user_can_only_delete_own_comments', async () => {
      // Jake comments
      const jakeCommentResponse = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          comment: {
            body: 'Jake comment',
          },
        });

      // Jane comments
      const janeCommentResponse = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${janeToken}`)
        .send({
          comment: {
            body: 'Jane comment',
          },
        });

      // Jane tries to delete Jake's comment - should fail
      let response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${jakeCommentResponse.body.comment.id}`)
        .set('Authorization', `Token ${janeToken}`);
      expect(response.status).toBe(403);

      // Jane deletes her own comment - should succeed
      response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${janeCommentResponse.body.comment.id}`)
        .set('Authorization', `Token ${janeToken}`);
      expect(response.status).toBe(200);

      // Verify only Jake's comment remains
      response = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].author.username).toBe('jake');
    });
  });
});
