import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../../src/repositories/in-memory/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../../src/repositories/in-memory/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../../src/repositories/in-memory/InMemoryCommentRepository';
import { AuthService } from '../../src/services/AuthService';
import { ProfileService } from '../../src/services/ProfileService';
import { ArticleService } from '../../src/services/ArticleService';
import { CommentService } from '../../src/services/CommentService';

describe('Comments Integration Tests (All Endpoints)', () => {
  let app: any;
  let userToken: string;
  let otherToken: string;
  let articleSlug: string;

  beforeEach(async () => {
    const userRepository = new InMemoryUserRepository();
    const profileRepository = new InMemoryProfileRepository(userRepository);
    const articleRepository = new InMemoryArticleRepository(userRepository, profileRepository);
    const commentRepository = new InMemoryCommentRepository(userRepository, profileRepository, articleRepository);

    process.env.JWT_SECRET = 'comment-test-secret';
    const authService = new AuthService(userRepository, 'comment-test-secret', '1h');
    const profileService = new ProfileService(profileRepository);
    const articleService = new ArticleService(articleRepository);
    const commentService = new CommentService(commentRepository);

    app = createApp({
      userRepository,
      profileRepository,
      articleRepository,
      commentRepository,
      authService,
      profileService,
      articleService,
      commentService,
    });

    // Create user 1
    const u1Res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'userOne',
          email: 'one@example.com',
          password: 'password123',
        },
      });
    userToken = u1Res.body.user.token;

    // Create user 2
    const u2Res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'userTwo',
          email: 'two@example.com',
          password: 'password123',
        },
      });
    otherToken = u2Res.body.user.token;

    // User 1 creates an article
    const artRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${userToken}`)
      .send({
        article: {
          title: 'Article for Comments',
          description: 'desc',
          body: 'body',
          tagList: [],
        },
      });
    articleSlug = artRes.body.article.slug;
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should create comment and return status 201 with comment object', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          comment: {
            body: 'First comment on this post!',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('comment');
      expect(response.body.comment.body).toBe('First comment on this post!');
      expect(response.body.comment.author.username).toBe('userOne');
    });

    it('should return 401 when unauthenticated', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({
          comment: {
            body: 'Unauthenticated comment',
          },
        });

      expect(response.status).toBe(401);
    });

    it('should return 422 when comment body is missing', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          comment: {
            body: '',
          },
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          comment: {
            body: 'Existing comment',
          },
        });
    });

    it('should return list of comments with status 200', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}/comments`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments.length).toBe(1);
      expect(response.body.comments[0].body).toBe('Existing comment');
    });

    it('should return 404 for non-existent article slug', async () => {
      const response = await request(app).get('/api/articles/non-existent-article/comments');
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    let commentId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          comment: {
            body: 'Comment to delete',
          },
        });
      commentId = res.body.comment.id;
    });

    it('should return 403 when non-author attempts delete', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow author to delete comment (200)', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(200);

      const listRes = await request(app).get(`/api/articles/${articleSlug}/comments`);
      expect(listRes.body.comments.length).toBe(0);
    });
  });
});
