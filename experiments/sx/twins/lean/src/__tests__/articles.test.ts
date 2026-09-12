import request from 'supertest';
import app from '../index';

describe('Articles', () => {
  let authToken: string;
  let articleSlug: string;

  beforeAll(async () => {
    const user = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'article-test@test.com',
          username: 'articleuser',
          password: 'password123'
        }
      });
    authToken = user.body.user.token;
  });

  describe('POST /api/articles', () => {
    it('should create an article', async () => {
      const article = {
        title: 'Test Article',
        description: 'This is a test',
        body: 'Article body content',
        tagList: ['test', 'node']
      };

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authToken}`)
        .send({ article });

      expect(response.status).toBe(201);
      expect(response.body.article).toHaveProperty('slug');
      expect(response.body.article).toHaveProperty('title', article.title);
      expect(response.body.article).toHaveProperty('description', article.description);
      expect(response.body.article).toHaveProperty('body', article.body);
      expect(response.body.article.tagList).toEqual(expect.arrayContaining(article.tagList));
      expect(response.body.article).toHaveProperty('favorited', false);
      expect(response.body.article).toHaveProperty('favoritesCount', 0);
      expect(response.body.article.author).toHaveProperty('username', 'articleuser');

      articleSlug = response.body.article.slug;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({ article: { title: 'Test', description: 'Test', body: 'Test' } });

      expect(response.status).toBe(401);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authToken}`)
        .send({ article: { title: 'Test' } });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('should get an article by slug', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.article).toHaveProperty('slug', articleSlug);
      expect(response.body.article).toHaveProperty('body');
    });

    it('should return 404 for non-existent article', async () => {
      const response = await request(app).get('/api/articles/nonexistent-slug');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/articles', () => {
    it('should list articles', async () => {
      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('articlesCount');
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.articles.length).toBeGreaterThan(0);
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('should filter by tag', async () => {
      const response = await request(app).get('/api/articles?tag=test');

      expect(response.status).toBe(200);
      expect(response.body.articles.every((a: any) => 
        a.tagList.includes('test')
      )).toBe(true);
    });

    it('should filter by author', async () => {
      const response = await request(app).get('/api/articles?author=articleuser');

      expect(response.status).toBe(200);
      expect(response.body.articles.every((a: any) => 
        a.author.username === 'articleuser'
      )).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app).get('/api/articles?limit=1&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeLessThanOrEqual(1);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('should update an article', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${authToken}`)
        .send({ article: updates });

      expect(response.status).toBe(200);
      expect(response.body.article).toHaveProperty('title', updates.title);
      expect(response.body.article).toHaveProperty('description', updates.description);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .send({ article: { title: 'Updated' } });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    it('should favorite an article', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article).toHaveProperty('favorited', true);
      expect(response.body.article).toHaveProperty('favoritesCount', 1);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    it('should unfavorite an article', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article).toHaveProperty('favorited', false);
      expect(response.body.article).toHaveProperty('favoritesCount', 0);
    });
  });

  describe('GET /api/articles/feed', () => {
    it('should get feed of followed users articles', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('articlesCount');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/articles/feed');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('should delete an article', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 404 after deletion', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}`);

      expect(response.status).toBe(404);
    });
  });
});
