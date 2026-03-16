import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('Article Endpoints', () => {
  let userToken: string;
  let otherUserToken: string;
  let username: string;
  let otherUsername: string;

  beforeEach(async () => {
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    const userResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123'
        }
      });

    userToken = userResponse.body.user.token;
    username = userResponse.body.user.username;

    const otherResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'janedoe',
          email: 'jane@example.com',
          password: 'password123'
        }
      });

    otherUserToken = otherResponse.body.user.token;
    otherUsername = otherResponse.body.user.username;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/articles', () => {
    it('creates an article successfully', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'How to Train Your Dragon',
            description: 'Ever wonder how?',
            body: 'It takes a lot of practice',
            tagList: ['dragons', 'training']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article).toHaveProperty('slug');
      expect(response.body.article.title).toBe('How to Train Your Dragon');
      expect(response.body.article.description).toBe('Ever wonder how?');
      expect(response.body.article.body).toBe('It takes a lot of practice');
      expect(response.body.article.tagList).toEqual(['dragons', 'training']);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
      expect(response.body.article.author.username).toBe(username);
      expect(response.body.article.author.following).toBe(false);
    });

    it('creates article with empty tag list', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article Without Tags',
            description: 'No tags here',
            body: 'Content goes here'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.tagList).toEqual([]);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Test Article',
            description: 'Test',
            body: 'Test body'
          }
        });

      expect(response.status).toBe(401);
    });

    it('returns 422 when title is missing', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            description: 'Test',
            body: 'Test body'
          }
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body content',
            tagList: ['test']
          }
        });

      articleSlug = response.body.article.slug;
    });

    it('returns article by slug', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.article.slug).toBe(articleSlug);
      expect(response.body.article.title).toBe('Test Article');
      expect(response.body.article.body).toBe('Test body content');
      expect(response.body.article.favorited).toBe(false);
    });

    it('returns article with favorited true when user has favorited', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      const response = await request(app)
        .get(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('returns 404 when article does not exist', async () => {
      const response = await request(app)
        .get('/api/articles/nonexistent-slug');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/articles', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'First article',
            body: 'Content 1',
            tagList: ['tag1', 'tag2']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${otherUserToken}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Second article',
            body: 'Content 2',
            tagList: ['tag2', 'tag3']
          }
        });
    });

    it('returns all articles without filters', async () => {
      const response = await request(app)
        .get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(2);
      expect(response.body.articlesCount).toBe(2);
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('filters articles by tag', async () => {
      const response = await request(app)
        .get('/api/articles?tag=tag1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('Article 1');
      expect(response.body.articlesCount).toBe(1);
    });

    it('filters articles by author', async () => {
      const response = await request(app)
        .get(`/api/articles?author=${otherUsername}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('Article 2');
      expect(response.body.articlesCount).toBe(1);
    });

    it('filters articles by favorited user', async () => {
      const articlesResponse = await request(app)
        .get('/api/articles');
      const slug = articlesResponse.body.articles[0].slug;

      await request(app)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      const response = await request(app)
        .get(`/api/articles?favorited=${otherUsername}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articlesCount).toBe(1);
    });

    it('supports pagination with limit and offset', async () => {
      const response = await request(app)
        .get('/api/articles?limit=1&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articlesCount).toBe(2);
    });

    it('returns empty array when no articles match filter', async () => {
      const response = await request(app)
        .get('/api/articles?tag=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
      expect(response.body.articlesCount).toBe(0);
    });
  });

  describe('GET /api/articles/feed', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/profiles/${username}/follow`)
        .set('Authorization', `Token ${otherUserToken}`);

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Feed Article',
            description: 'From followed user',
            body: 'Content',
            tagList: []
          }
        });
    });

    it('returns articles from followed users', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('Feed Article');
      expect(response.body.articles[0].author.username).toBe(username);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('returns empty array when not following anyone', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
      expect(response.body.articlesCount).toBe(0);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/articles/feed');

      expect(response.status).toBe(401);
    });

    it('supports pagination', async () => {
      const response = await request(app)
        .get('/api/articles/feed?limit=10&offset=0')
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Original Title',
            description: 'Original description',
            body: 'Original body'
          }
        });

      articleSlug = response.body.article.slug;
    });

    it('updates article title', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Updated Title'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.title).toBe('Updated Title');
      expect(response.body.article.slug).not.toBe(articleSlug);
    });

    it('updates article description and body', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            description: 'Updated description',
            body: 'Updated body'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.description).toBe('Updated description');
      expect(response.body.article.body).toBe('Updated body');
    });

    it('returns 403 when user is not the author', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${otherUserToken}`)
        .send({
          article: {
            title: 'Hacked Title'
          }
        });

      expect(response.status).toBe(403);
      expect(response.body.errors.body).toContain(
        'Forbidden: You are not the author of this article'
      );
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .send({
          article: {
            title: 'Updated Title'
          }
        });

      expect(response.status).toBe(401);
    });

    it('returns 404 when article does not exist', async () => {
      const response = await request(app)
        .put('/api/articles/nonexistent-slug')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Updated Title'
          }
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article to Delete',
            description: 'Will be deleted',
            body: 'Content'
          }
        });

      articleSlug = response.body.article.slug;
    });

    it('deletes article successfully', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(200);

      const getResponse = await request(app)
        .get(`/api/articles/${articleSlug}`);

      expect(getResponse.status).toBe(404);
    });

    it('returns 403 when user is not the author', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(403);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`);

      expect(response.status).toBe(401);
    });

    it('returns 404 when article does not exist', async () => {
      const response = await request(app)
        .delete('/api/articles/nonexistent-slug')
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article to Favorite',
            description: 'Description',
            body: 'Content'
          }
        });

      articleSlug = response.body.article.slug;
    });

    it('favorites article successfully', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('is idempotent when already favorited', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`);

      expect(response.status).toBe(401);
    });

    it('returns 404 when article does not exist', async () => {
      const response = await request(app)
        .post('/api/articles/nonexistent-slug/favorite')
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article to Unfavorite',
            description: 'Description',
            body: 'Content'
          }
        });

      articleSlug = response.body.article.slug;

      await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);
    });

    it('unfavorites article successfully', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });

    it('is idempotent when not favorited', async () => {
      await request(app)
        .delete(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/favorite`);

      expect(response.status).toBe(401);
    });

    it('returns 404 when article does not exist', async () => {
      const response = await request(app)
        .delete('/api/articles/nonexistent-slug/favorite')
        .set('Authorization', `Token ${otherUserToken}`);

      expect(response.status).toBe(404);
    });
  });
});
