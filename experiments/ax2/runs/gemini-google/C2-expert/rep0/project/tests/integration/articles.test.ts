import request from 'supertest';
import { app } from '../../src/app';
import { clearDatabase, disconnectDatabase } from '../helpers/test-db';

describe('Articles endpoints', () => {
  let authorToken: string;
  let otherToken: string;
  let createdSlug: string;

  beforeEach(async () => {
    await clearDatabase();

    const authorRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'author',
          email: 'author@example.com',
          password: 'password123'
        }
      });
    authorToken = authorRes.body.user.token;

    const otherRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'other',
          email: 'other@example.com',
          password: 'password123'
        }
      });
    otherToken = otherRes.body.user.token;

    const articleRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'First Post',
          description: 'A great post',
          body: 'Detailed post body text',
          tagList: ['dragons', 'training']
        }
      });
    createdSlug = articleRes.body.article.slug;
  });

  afterAll(async () => {
    await clearDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/articles', () => {
    it('returns 201 with article payload including body on successful creation', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'How to train dragons',
            description: 'Ever wonder how?',
            body: 'Detailed steps to train dragons',
            tagList: ['training']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.title).toBe('How to train dragons');
      expect(response.body.article.body).toBe('Detailed steps to train dragons');
      expect(response.body.article.tagList).toContain('training');
      expect(response.body.article.author.username).toBe('author');
    });

    it('returns 401 when creating article without authorization token', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Unauthenticated Article',
            description: 'Desc',
            body: 'Body'
          }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/articles (list)', () => {
    it('returns articles array without body property in list items', async () => {
      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('articlesCount');
      expect(response.body.articles.length).toBeGreaterThan(0);
      expect(response.body.articles[0].body).toBeUndefined();
    });

    it('filters articles by tag', async () => {
      const response = await request(app).get('/api/articles?tag=dragons');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articles[0].tagList).toContain('dragons');
    });

    it('filters articles by author username', async () => {
      const response = await request(app).get('/api/articles?author=author');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articles[0].author.username).toBe('author');
    });

    it('filters articles by favorited username', async () => {
      await request(app)
        .post(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${otherToken}`);

      const response = await request(app).get('/api/articles?favorited=other');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articles[0].slug).toBe(createdSlug);
    });

    it('respects limit and offset pagination parameters', async () => {
      const response = await request(app).get('/api/articles?limit=1&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
    });
  });

  describe('GET /api/articles/feed', () => {
    it('returns articles from followed authors only', async () => {
      // other follows author
      await request(app)
        .post('/api/profiles/author/follow')
        .set('Authorization', `Token ${otherToken}`);

      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articles[0].author.username).toBe('author');
      expect(response.body.articles[0].body).toBeUndefined();
    });

    it('returns 401 when fetching feed without authentication token', async () => {
      const response = await request(app).get('/api/articles/feed');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns 200 with complete article details including body', async () => {
      const response = await request(app).get(`/api/articles/${createdSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.article.slug).toBe(createdSlug);
      expect(response.body.article.body).toBe('Detailed post body text');
    });

    it('returns 404 when slug does not match any existing article', async () => {
      const response = await request(app).get('/api/articles/nonexistent-article-slug');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('returns 200 with updated article when updated by author', async () => {
      const response = await request(app)
        .put(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Updated Post Title',
            description: 'Updated description'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.title).toBe('Updated Post Title');
      expect(response.body.article.description).toBe('Updated description');
    });

    it('returns 403 when updating article authored by another user', async () => {
      const response = await request(app)
        .put(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${otherToken}`)
        .send({
          article: {
            title: 'Hacked Title'
          }
        });

      expect(response.status).toBe(403);
    });

    it('returns 401 when updating article without authentication token', async () => {
      const response = await request(app)
        .put(`/api/articles/${createdSlug}`)
        .send({
          article: {
            title: 'Title'
          }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('returns 403 when deleting article authored by another user', async () => {
      const response = await request(app)
        .delete(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('returns 401 when deleting article without authentication token', async () => {
      const response = await request(app).delete(`/api/articles/${createdSlug}`);

      expect(response.status).toBe(401);
    });

    it('returns 200 when deleting article authored by current user', async () => {
      const response = await request(app)
        .delete(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${authorToken}`);

      expect(response.status).toBe(200);

      const verifyGet = await request(app).get(`/api/articles/${createdSlug}`);
      expect(verifyGet.status).toBe(404);
    });
  });

  describe('POST & DELETE /api/articles/:slug/favorite', () => {
    it('returns 200 with favorited true after favoriting an article', async () => {
      const response = await request(app)
        .post(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('returns 200 with favorited false after unfavoriting an article', async () => {
      await request(app)
        .post(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${otherToken}`);

      const response = await request(app)
        .delete(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });

    it('returns 401 when favoriting without authentication token', async () => {
      const response = await request(app).post(`/api/articles/${createdSlug}/favorite`);

      expect(response.status).toBe(401);
    });

    it('returns 401 when unfavoriting without authentication token', async () => {
      const response = await request(app).delete(`/api/articles/${createdSlug}/favorite`);

      expect(response.status).toBe(401);
    });
  });
});
