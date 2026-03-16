import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('API Integration & Hardening Verification', () => {
  let userToken: string;
  let username: string;
  let articleSlug: string;
  let commentId: string;

  beforeAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    const userResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      });

    userToken = userResponse.body.user.token;
    username = userResponse.body.user.username;

    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${userToken}`)
      .send({
        article: {
          title: 'Test Article',
          description: 'Test description',
          body: 'Test body',
          tagList: ['test']
        }
      });

    articleSlug = articleResponse.body.article.slug;

    const commentResponse = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${userToken}`)
      .send({
        comment: {
          body: 'Test comment'
        }
      });

    commentId = commentResponse.body.comment.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Endpoint Reachability & Status Codes', () => {
    describe('User & Authentication Endpoints', () => {
      it('POST /api/users returns 201 on success', async () => {
        const response = await request(app)
          .post('/api/users')
          .send({
            user: {
              username: 'newuser',
              email: 'new@example.com',
              password: 'password123'
            }
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
      });

      it('POST /api/users/login returns 200 on success', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            user: {
              email: 'test@example.com',
              password: 'password123'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
      });

      it('GET /api/user returns 200 with valid token', async () => {
        const response = await request(app)
          .get('/api/user')
          .set('Authorization', `Token ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
      });

      it('PUT /api/user returns 200 on success', async () => {
        const response = await request(app)
          .put('/api/user')
          .set('Authorization', `Token ${userToken}`)
          .send({
            user: {
              bio: 'Updated bio'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
      });
    });

    describe('Profile Endpoints', () => {
      it('GET /api/profiles/:username returns 200', async () => {
        const response = await request(app)
          .get(`/api/profiles/${username}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('profile');
      });

      it('POST /api/profiles/:username/follow returns 200', async () => {
        const otherUserResponse = await request(app)
          .post('/api/users')
          .send({
            user: {
              username: 'otheruser',
              email: 'other@example.com',
              password: 'password123'
            }
          });

        const response = await request(app)
          .post(`/api/profiles/${username}/follow`)
          .set('Authorization', `Token ${otherUserResponse.body.user.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('profile');
      });

      it('DELETE /api/profiles/:username/follow returns 200', async () => {
        const otherUserResponse = await request(app)
          .post('/api/users')
          .send({
            user: {
              username: 'anotheruser',
              email: 'another@example.com',
              password: 'password123'
            }
          });

        await request(app)
          .post(`/api/profiles/${username}/follow`)
          .set('Authorization', `Token ${otherUserResponse.body.user.token}`);

        const response = await request(app)
          .delete(`/api/profiles/${username}/follow`)
          .set('Authorization', `Token ${otherUserResponse.body.user.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('profile');
      });
    });

    describe('Article Endpoints', () => {
      it('GET /api/articles returns 200', async () => {
        const response = await request(app)
          .get('/api/articles');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('articles');
        expect(response.body).toHaveProperty('articlesCount');
      });

      it('GET /api/articles/feed returns 200 with auth', async () => {
        const response = await request(app)
          .get('/api/articles/feed')
          .set('Authorization', `Token ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('articles');
        expect(response.body).toHaveProperty('articlesCount');
      });

      it('GET /api/articles/:slug returns 200', async () => {
        const response = await request(app)
          .get(`/api/articles/${articleSlug}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('article');
      });

      it('POST /api/articles returns 201', async () => {
        const response = await request(app)
          .post('/api/articles')
          .set('Authorization', `Token ${userToken}`)
          .send({
            article: {
              title: 'New Article',
              description: 'Description',
              body: 'Body',
              tagList: []
            }
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('article');
      });

      it('PUT /api/articles/:slug returns 200', async () => {
        const response = await request(app)
          .put(`/api/articles/${articleSlug}`)
          .set('Authorization', `Token ${userToken}`)
          .send({
            article: {
              description: 'Updated description'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('article');
      });

      it('DELETE /api/articles/:slug returns 200', async () => {
        const createResponse = await request(app)
          .post('/api/articles')
          .set('Authorization', `Token ${userToken}`)
          .send({
            article: {
              title: 'Article to Delete',
              description: 'Description',
              body: 'Body'
            }
          });

        const response = await request(app)
          .delete(`/api/articles/${createResponse.body.article.slug}`)
          .set('Authorization', `Token ${userToken}`);

        expect(response.status).toBe(200);
      });

      it('POST /api/articles/:slug/favorite returns 200', async () => {
        const response = await request(app)
          .post(`/api/articles/${articleSlug}/favorite`)
          .set('Authorization', `Token ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('article');
      });

      it('DELETE /api/articles/:slug/favorite returns 200', async () => {
        await request(app)
          .post(`/api/articles/${articleSlug}/favorite`)
          .set('Authorization', `Token ${userToken}`);

        const response = await request(app)
          .delete(`/api/articles/${articleSlug}/favorite`)
          .set('Authorization', `Token ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('article');
      });
    });

    describe('Comment Endpoints', () => {
      it('GET /api/articles/:slug/comments returns 200', async () => {
        const response = await request(app)
          .get(`/api/articles/${articleSlug}/comments`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('comments');
      });

      it('POST /api/articles/:slug/comments returns 201', async () => {
        const response = await request(app)
          .post(`/api/articles/${articleSlug}/comments`)
          .set('Authorization', `Token ${userToken}`)
          .send({
            comment: {
              body: 'New comment'
            }
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('comment');
      });

      it('DELETE /api/articles/:slug/comments/:id returns 200', async () => {
        const response = await request(app)
          .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
          .set('Authorization', `Token ${userToken}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Tag Endpoints', () => {
      it('GET /api/tags returns 200', async () => {
        const response = await request(app)
          .get('/api/tags');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('tags');
        expect(Array.isArray(response.body.tags)).toBe(true);
      });
    });
  });

  describe('Error Response Format Verification', () => {
    it('401 errors follow spec format', async () => {
      const response = await request(app)
        .get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(Array.isArray(response.body.errors.body)).toBe(true);
    });

    it('404 errors follow spec format', async () => {
      const response = await request(app)
        .get('/api/articles/nonexistent-slug-12345');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(Array.isArray(response.body.errors.body)).toBe(true);
    });

    it('422 validation errors follow spec format', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'test',
            email: 'invalid-email',
            password: 'pass'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(Array.isArray(response.body.errors.body)).toBe(true);
    });

    it('403 forbidden errors follow spec format', async () => {
      const otherUserResponse = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'forbiddenuser',
            email: 'forbidden@example.com',
            password: 'password123'
          }
        });

      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${otherUserResponse.body.user.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(Array.isArray(response.body.errors.body)).toBe(true);
    });
  });

  describe('Response Format Compliance', () => {
    it('user responses include all required fields', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${userToken}`);

      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username');
      expect(response.body.user).toHaveProperty('bio');
      expect(response.body.user).toHaveProperty('image');
    });

    it('profile responses include all required fields', async () => {
      const response = await request(app)
        .get(`/api/profiles/${username}`);

      expect(response.body.profile).toHaveProperty('username');
      expect(response.body.profile).toHaveProperty('bio');
      expect(response.body.profile).toHaveProperty('image');
      expect(response.body.profile).toHaveProperty('following');
    });

    it('article responses include all required fields', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}`);

      expect(response.body.article).toHaveProperty('slug');
      expect(response.body.article).toHaveProperty('title');
      expect(response.body.article).toHaveProperty('description');
      expect(response.body.article).toHaveProperty('body');
      expect(response.body.article).toHaveProperty('tagList');
      expect(response.body.article).toHaveProperty('createdAt');
      expect(response.body.article).toHaveProperty('updatedAt');
      expect(response.body.article).toHaveProperty('favorited');
      expect(response.body.article).toHaveProperty('favoritesCount');
      expect(response.body.article).toHaveProperty('author');
      expect(response.body.article.author).toHaveProperty('username');
      expect(response.body.article.author).toHaveProperty('bio');
      expect(response.body.article.author).toHaveProperty('image');
      expect(response.body.article.author).toHaveProperty('following');
    });

    it('article list responses exclude body field', async () => {
      const response = await request(app)
        .get('/api/articles');

      expect(response.body.articles.length).toBeGreaterThan(0);
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('comment responses include all required fields', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}/comments`);

      if (response.body.comments.length > 0) {
        expect(response.body.comments[0]).toHaveProperty('id');
        expect(response.body.comments[0]).toHaveProperty('createdAt');
        expect(response.body.comments[0]).toHaveProperty('updatedAt');
        expect(response.body.comments[0]).toHaveProperty('body');
        expect(response.body.comments[0]).toHaveProperty('author');
        expect(response.body.comments[0].author).toHaveProperty('username');
        expect(response.body.comments[0].author).toHaveProperty('bio');
        expect(response.body.comments[0].author).toHaveProperty('image');
        expect(response.body.comments[0].author).toHaveProperty('following');
      }
    });
  });
});
