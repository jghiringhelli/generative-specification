// tests/integration/errors.test.ts
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Error Handling and Edge Cases Integration Tests', () => {
  let userToken: string;
  let otherToken: string;
  const userA = `errA_${Date.now()}`;
  const userB = `errB_${Date.now()}`;
  let articleSlug: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'error-handling-secret';

    const resA = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${userA}@example.com`,
          username: userA,
          password: 'Password123!'
        }
      });
    userToken = resA.body.user.token;

    const resB = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${userB}@example.com`,
          username: userB,
          password: 'Password123!'
        }
      });
    otherToken = resB.body.user.token;

    const resArticle = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${userToken}`)
      .send({
        article: {
          title: 'Article for Error Handling',
          description: 'Testing errors',
          body: 'Error test content'
        }
      });
    articleSlug = resArticle.body.article.slug;
  });

  describe('401 Unauthorized Paths', () => {
    it('GET /api/user without token returns 401 with errors.body', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.body).toBeDefined();
    });

    it('GET /api/user with malformed token returns 401', async () => {
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token completely-invalid-jwt-token');
      expect(res.status).toBe(401);
      expect(res.body.errors.body).toBeDefined();
    });

    it('POST /api/articles without token returns 401', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({ article: { title: 'T', description: 'D', body: 'B' } });
      expect(res.status).toBe(401);
      expect(res.body.errors.body).toBeDefined();
    });

    it('POST /api/profiles/:username/follow without token returns 401', async () => {
      const res = await request(app).post(`/api/profiles/${userB}/follow`);
      expect(res.status).toBe(401);
    });

    it('POST /api/articles/:slug/comments without token returns 401', async () => {
      const res = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .send({ comment: { body: 'comment' } });
      expect(res.status).toBe(401);
    });
  });

  describe('403 Forbidden Paths', () => {
    it('PUT /api/articles/:slug by non-author returns 403', async () => {
      const res = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${otherToken}`)
        .send({ article: { title: 'Hijacked' } });
      expect(res.status).toBe(403);
      expect(res.body.errors.body).toBeDefined();
    });

    it('DELETE /api/articles/:slug by non-author returns 403', async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${otherToken}`);
      expect(res.status).toBe(403);
      expect(res.body.errors.body).toBeDefined();
    });
  });

  describe('404 Not Found Paths', () => {
    it('GET /api/profiles/:username for nonexistent user returns 404', async () => {
      const res = await request(app).get('/api/profiles/this_user_does_not_exist_404');
      expect(res.status).toBe(404);
      expect(res.body.errors.body).toBeDefined();
    });

    it('GET /api/articles/:slug for nonexistent article returns 404', async () => {
      const res = await request(app).get('/api/articles/nonexistent-article-slug-404');
      expect(res.status).toBe(404);
      expect(res.body.errors.body).toBeDefined();
    });

    it('POST /api/articles/:slug/favorite for nonexistent article returns 404', async () => {
      const res = await request(app)
        .post('/api/articles/nonexistent-slug/favorite')
        .set('Authorization', `Token ${userToken}`);
      expect(res.status).toBe(404);
    });

    it('DELETE /api/articles/:slug/comments/:id for nonexistent comment returns 404', async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/999999`)
        .set('Authorization', `Token ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('422 Unprocessable Entity Paths', () => {
    it('POST /api/users with missing fields returns 422', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: {} });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /api/articles with missing body returns 422', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({ article: { title: 'Title only' } });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /api/articles/:slug/comments with empty body returns 422', async () => {
      const res = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${userToken}`)
        .send({ comment: { body: '' } });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });
  });
});
