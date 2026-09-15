import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Articles Endpoints Integration Tests', () => {
  const timestamp = Date.now();
  let authorToken = '';
  let otherUserToken = '';
  let createdSlug = '';

  const author = {
    username: `artauthor_${timestamp}`,
    email: `artauthor_${timestamp}@example.com`,
    password: 'password123'
  };

  const otherUser = {
    username: `artother_${timestamp}`,
    email: `artother_${timestamp}@example.com`,
    password: 'password123'
  };

  beforeAll(async () => {
    // Create author
    const res1 = await request(app)
      .post('/api/users')
      .send({ user: author });
    authorToken = res1.body.user.token;

    // Create other user
    const res2 = await request(app)
      .post('/api/users')
      .send({ user: otherUser });
    otherUserToken = res2.body.user.token;
  });

  afterAll(async () => {
    await prisma.favorite.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.article.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.follows.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'example.com'
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/articles', () => {
    it('creates article and returns full article including body on valid payload', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: `First Test Article ${timestamp}`,
            description: 'A detailed test description',
            body: 'Full body content of the article',
            tagList: ['dragons', 'training']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('article');
      expect(response.body.article.title).toBe(`First Test Article ${timestamp}`);
      expect(response.body.article.body).toBe('Full body content of the article');
      expect(response.body.article.tagList).toContain('dragons');
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
      expect(response.body.article.author.username).toBe(author.username);

      createdSlug = response.body.article.slug;
    });

    it('returns 401 when creating article without authorization', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Unauthorized Article',
            description: 'Desc',
            body: 'Body'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns 422 when required article fields are missing', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: ''
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('retrieves single article by slug including full body', async () => {
      const response = await request(app).get(`/api/articles/${createdSlug}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('article');
      expect(response.body.article.slug).toBe(createdSlug);
      expect(response.body.article.body).toBeDefined();
    });

    it('returns 404 when requested article slug does not exist', async () => {
      const response = await request(app).get('/api/articles/non-existent-article-slug-404');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/articles (list and filters)', () => {
    it('lists articles without body property in list items', async () => {
      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('articlesCount');
      expect(response.body.articles.length).toBeGreaterThan(0);
      // Spec change 2024-08-16: body must NOT be in list items
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('filters articles by tag', async () => {
      const response = await request(app).get('/api/articles?tag=dragons');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeGreaterThan(0);
      expect(response.body.articles[0].tagList).toContain('dragons');
    });

    it('filters articles by author username', async () => {
      const response = await request(app).get(`/api/articles?author=${author.username}`);

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeGreaterThan(0);
      expect(response.body.articles[0].author.username).toBe(author.username);
    });

    it('handles pagination with limit and offset', async () => {
      const response = await request(app).get('/api/articles?limit=1&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeLessThanOrEqual(1);
    });

    it('returns 422 when invalid pagination values are passed', async () => {
      const response = await request(app).get('/api/articles?limit=-5');

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('updates article when requested by author', async () => {
      const response = await request(app)
        .put(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            description: 'Updated article description'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.description).toBe('Updated article description');
    });

    it('returns 403 when updating article authored by another user', async () => {
      const response = await request(app)
        .put(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${otherUserToken}`)
        .send({
          article: {
            description: 'Malicious update attempt'
          }
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns 401 when updating article without authorization', async () => {
      const response = await request(app)
        .put(`/api/articles/${createdSlug}`)
        .send({
          article: {
            description: 'Unauthorized update'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST & DELETE /api/articles/:slug/favorite', () => {
    it('returns 401 when favoriting without authorization', async () => {
      const response = await request(app).post(`/api/articles/${createdSlug}/favorite`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });

    it('favorites article and increments favoritesCount', async () => {
      const response = await request(app)
        .post(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('filters articles by favorited username', async () => {
      const response = await request(app).get(`/api/articles?favorited=${otherUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articles[0].slug).toBe(createdSlug);
    });

    it('unfavorites article and decrements favoritesCount', async () => {
      const response = await request(app)
        .delete(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });
  });

  describe('GET /api/articles/feed', () => {
    it('returns 401 when accessing feed without authorization', async () => {
      const response = await request(app).get('/api/articles/feed');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns feed articles from followed authors without body property', async () => {
      // otherUser follows author
      await request(app)
        .post(`/api/profiles/${author.username}/follow`)
        .set('Authorization', `Token ${otherUserToken}`);

      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('articlesCount');
      expect(response.body.articles.length).toBeGreaterThan(0);
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('returns 403 when deleting article authored by another user', async () => {
      const response = await request(app)
        .delete(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns 401 when deleting article without authorization', async () => {
      const response = await request(app).delete(`/api/articles/${createdSlug}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });

    it('successfully deletes article when requested by author', async () => {
      const response = await request(app)
        .delete(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${authorToken}`);

      expect(response.status).toBe(204);

      // Verify article is gone
      const getRes = await request(app).get(`/api/articles/${createdSlug}`);
      expect(getRes.status).toBe(404);
    });
  });
});
