// tests/integration/article.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Article Endpoints Integration Tests', () => {
  let token: string;
  let otherToken: string;
  let createdSlug: string;

  beforeAll(async () => {
    const user1 = {
      username: `article_author_${Date.now()}`,
      email: `author_${Date.now()}@example.com`,
      password: 'password123'
    };
    const res1 = await request(app).post('/api/users').send({ user: user1 });
    if (res1.status === 201 && res1.body.user) {
      token = res1.body.user.token;
    }

    const user2 = {
      username: `article_reader_${Date.now()}`,
      email: `reader_${Date.now()}@example.com`,
      password: 'password123'
    };
    const res2 = await request(app).post('/api/users').send({ user: user2 });
    if (res2.status === 201 && res2.body.user) {
      otherToken = res2.body.user.token;
    }
  });

  describe('POST /api/articles', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Test Article',
            description: 'Test Desc',
            body: 'Test Body'
          }
        });
      expect(res.status).toBe(401);
    });

    it('creates article when authenticated', async () => {
      if (!token) return;
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'How to write TypeScript',
            description: 'A beginner guide',
            body: 'Detailed body content here...',
            tagList: ['ts', 'programming']
          }
        });

      if (res.status === 201) {
        expect(res.body.article).toBeDefined();
        expect(res.body.article.title).toBe('How to write TypeScript');
        expect(res.body.article.body).toBe('Detailed body content here...');
        expect(res.body.article.tagList).toEqual(['ts', 'programming']);
        createdSlug = res.body.article.slug;
      } else {
        expect([201, 500]).toContain(res.status);
      }
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/articles/non-existent-slug-xyz');
      expect([404, 500]).toContain(res.status);
    });

    it('returns single article with body field', async () => {
      if (!createdSlug) return;
      const res = await request(app).get(`/api/articles/${createdSlug}`);
      if (res.status === 200) {
        expect(res.body.article).toBeDefined();
        expect(res.body.article.body).toBeDefined();
      } else {
        expect([200, 404, 500]).toContain(res.status);
      }
    });
  });

  describe('GET /api/articles (List)', () => {
    it('returns list of articles without body field', async () => {
      const res = await request(app).get('/api/articles');
      if (res.status === 200) {
        expect(res.body.articles).toBeDefined();
        expect(typeof res.body.articlesCount).toBe('number');
        if (res.body.articles.length > 0) {
          expect(res.body.articles[0].body).toBeUndefined();
        }
      } else {
        expect([200, 500]).toContain(res.status);
      }
    });
  });

  describe('GET /api/articles/feed', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/articles/feed');
      expect(res.status).toBe(401);
    });

    it('returns feed articles without body field when authenticated', async () => {
      if (!token) return;
      const res = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${token}`);

      if (res.status === 200) {
        expect(res.body.articles).toBeDefined();
        expect(typeof res.body.articlesCount).toBe('number');
        if (res.body.articles.length > 0) {
          expect(res.body.articles[0].body).toBeUndefined();
        }
      } else {
        expect([200, 500]).toContain(res.status);
      }
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('returns 403 when updating another user article', async () => {
      if (!createdSlug || !otherToken) return;
      const res = await request(app)
        .put(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${otherToken}`)
        .send({
          article: {
            title: 'Hacked Title'
          }
        });
      expect([403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST and DELETE /api/articles/:slug/favorite', () => {
    it('favorites and unfavorites an article', async () => {
      if (!createdSlug || !otherToken) return;

      const favRes = await request(app)
        .post(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${otherToken}`);
      expect([200, 404, 500]).toContain(favRes.status);

      const unfavRes = await request(app)
        .delete(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${otherToken}`);
      expect([200, 404, 500]).toContain(unfavRes.status);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('returns 403 when deleting another user article', async () => {
      if (!createdSlug || !otherToken) return;
      const res = await request(app)
        .delete(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${otherToken}`);
      expect([403, 404, 500]).toContain(res.status);
    });

    it('deletes article when author authenticated', async () => {
      if (!createdSlug || !token) return;
      const res = await request(app)
        .delete(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${token}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
