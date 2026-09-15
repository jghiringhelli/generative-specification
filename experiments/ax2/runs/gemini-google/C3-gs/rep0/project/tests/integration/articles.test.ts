// tests/integration/articles.test.ts
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Articles Endpoints Integration Tests', () => {
  let authorToken: string;
  let otherUserToken: string;
  const authorUsername = `artauthor_${Date.now()}`;
  const otherUsername = `artreader_${Date.now()}`;
  let createdArticleSlug: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'articles-test-secret';

    // Register author
    const resAuthor = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${authorUsername}@example.com`,
          username: authorUsername,
          password: 'Password123!'
        }
      });
    authorToken = resAuthor.body.user.token;

    // Register other user
    const resOther = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${otherUsername}@example.com`,
          username: otherUsername,
          password: 'Password123!'
        }
      });
    otherUserToken = resOther.body.user.token;
  });

  describe('POST /api/articles', () => {
    it('should return 401 when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Unauthorized Post',
            description: 'desc',
            body: 'body'
          }
        });

      expect(response.status).toBe(401);
    });

    it('should create an article with valid input', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'It takes a lot of patience and fish.',
            tagList: ['dragons', 'training']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article).toBeDefined();
      expect(response.body.article.title).toBe('How to train your dragon');
      expect(response.body.article.body).toBe('It takes a lot of patience and fish.');
      expect(response.body.article.tagList).toContain('dragons');
      expect(response.body.article.author.username).toBe(authorUsername);
      createdArticleSlug = response.body.article.slug;
    });

    it('should return 422 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: ''
          }
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('should retrieve article by slug with body included', async () => {
      const response = await request(app)
        .get(`/api/articles/${createdArticleSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.article.slug).toBe(createdArticleSlug);
      expect(response.body.article.body).toBeDefined();
    });

    it('should return 404 for unknown slug', async () => {
      const response = await request(app)
        .get('/api/articles/nonexistent-article-slug-xyz');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/articles (List & Filters)', () => {
    it('should list articles and NOT include body in list items (performance spec)', async () => {
      const response = await request(app)
        .get('/api/articles?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.articles).toBeDefined();
      expect(response.body.articlesCount).toBeGreaterThanOrEqual(1);

      const item = response.body.articles.find((a: any) => a.slug === createdArticleSlug);
      expect(item).toBeDefined();
      expect(item.body).toBeUndefined();
    });

    it('should filter articles by tag', async () => {
      const response = await request(app)
        .get('/api/articles?tag=dragons');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter articles by author', async () => {
      const response = await request(app)
        .get(`/api/articles?author=${authorUsername}`);

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST & DELETE /api/articles/:slug/favorite', () => {
    it('should favorite an article and increment favoritesCount', async () => {
      const response = await request(app)
        .post(`/api/articles/${createdArticleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('should filter articles by favorited username', async () => {
      const response = await request(app)
        .get(`/api/articles?favorited=${otherUsername}`);

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeGreaterThanOrEqual(1);
    });

    it('should unfavorite an article and decrement favoritesCount', async () => {
      const response = await request(app)
        .delete(`/api/articles/${createdArticleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });
  });

  describe('GET /api/articles/feed', () => {
    it('should return 401 when unauthenticated', async () => {
      const response = await request(app).get('/api/articles/feed');
      expect(response.status).toBe(401);
    });

    it('should return articles from followed users without body', async () => {
      // otherUser follows author
      await request(app)
        .post(`/api/profiles/${authorUsername}/follow`)
        .set('Authorization', `Token ${otherUserToken}`);

      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toBeDefined();
      expect(response.body.articles.length).toBeGreaterThanOrEqual(1);
      expect(response.body.articles[0].body).toBeUndefined();
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('should return 403 when non-author attempts update', async () => {
      const response = await request(app)
        .put(`/api/articles/${createdArticleSlug}`)
        .set('Authorization', `Token ${otherUserToken}`)
        .send({
          article: {
            title: 'Hacked Title'
          }
        });

      expect(response.status).toBe(403);
    });

    it('should update article when requested by author', async () => {
      const response = await request(app)
        .put(`/api/articles/${createdArticleSlug}`)
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            description: 'Updated dragons description'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.description).toBe('Updated dragons description');
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('should return 403 when non-author attempts delete', async () => {
      const response = await request(app)
        .delete(`/api/articles/${createdArticleSlug}`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(403);
    });

    it('should delete article when requested by author', async () => {
      const response = await request(app)
        .delete(`/api/articles/${createdArticleSlug}`)
        .set('Authorization', `Token ${authorToken}`);

      expect(response.status).toBe(204);

      // Verify it is gone
      const checkResponse = await request(app)
        .get(`/api/articles/${createdArticleSlug}`);
      expect(checkResponse.status).toBe(404);
    });
  });
});
