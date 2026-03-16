import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Application } from 'express';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://conduit:conduit@localhost:5432/conduit_test'
    }
  }
});

describe('Article Integration Tests', () => {
  let app: Application;
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    app = createApp(prisma);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');

    const user1Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user1@example.com',
          username: 'user1',
          password: 'password123'
        }
      });
    user1Token = user1Response.body.user.token;

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user2@example.com',
          username: 'user2',
          password: 'password123'
        }
      });
    user2Token = user2Response.body.user.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/articles', () => {
    it('create_article_with_valid_data_returns_201', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'How to Train Your Dragon',
            description: 'Ever wonder how?',
            body: 'You have to believe',
            tagList: ['dragons', 'training']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article).toMatchObject({
        slug: 'how-to-train-your-dragon',
        title: 'How to Train Your Dragon',
        description: 'Ever wonder how?',
        body: 'You have to believe',
        tagList: expect.arrayContaining(['dragons', 'training']),
        favorited: false,
        favoritesCount: 0
      });
      expect(response.body.article.author).toMatchObject({
        username: 'user1',
        following: false
      });
    });

    it('create_article_without_auth_returns_401', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Test',
            description: 'Test',
            body: 'Test'
          }
        });

      expect(response.status).toBe(401);
    });

    it('create_article_without_title_returns_422', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            description: 'Test',
            body: 'Test'
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
        .set('Authorization', `Token ${user1Token}`)
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

    it('get_existing_article_returns_200_with_body_field', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.article).toMatchObject({
        slug: articleSlug,
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test']
      });
    });

    it('get_nonexistent_article_returns_404', async () => {
      const response = await request(app)
        .get('/api/articles/nonexistent-slug');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Original Title',
            description: 'Original description',
            body: 'Original body'
          }
        });
      articleSlug = response.body.article.slug;
    });

    it('update_article_by_author_returns_200_with_updated_data', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Updated Title',
            body: 'Updated body'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.title).toBe('Updated Title');
      expect(response.body.article.body).toBe('Updated body');
      expect(response.body.article.description).toBe('Original description');
    });

    it('update_article_title_changes_slug', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Completely New Title'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.slug).toBe('completely-new-title');
    });

    it('update_article_by_non_author_returns_403', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'Hacked Title'
          }
        });

      expect(response.status).toBe(403);
    });

    it('update_article_without_auth_returns_401', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .send({
          article: {
            title: 'New Title'
          }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'To Delete',
            description: 'Will be deleted',
            body: 'Content'
          }
        });
      articleSlug = response.body.article.slug;
    });

    it('delete_article_by_author_returns_200', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/articles/${articleSlug}`);
      expect(getResponse.status).toBe(404);
    });

    it('delete_article_by_non_author_returns_403', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(403);
    });

    it('delete_article_without_auth_returns_401', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'To Favorite',
            description: 'Description',
            body: 'Body'
          }
        });
      articleSlug = response.body.article.slug;
    });

    it('favorite_article_returns_200_with_favorited_true', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('favorite_already_favorited_article_is_idempotent', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('favorite_without_auth_returns_401', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Favorited Article',
            description: 'Description',
            body: 'Body'
          }
        });
      articleSlug = createResponse.body.article.slug;

      await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${user2Token}`);
    });

    it('unfavorite_article_returns_200_with_favorited_false', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });
  });

  describe('GET /api/articles (list)', () => {
    beforeEach(async () => {
      // Create multiple articles
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Dragons Article',
            description: 'About dragons',
            body: 'Dragon content',
            tagList: ['dragons']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'Training Article',
            description: 'About training',
            body: 'Training content',
            tagList: ['training']
          }
        });
    });

    it('list_articles_returns_200_without_body_field', async () => {
      const response = await request(app)
        .get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(2);
      expect(response.body.articlesCount).toBe(2);
      expect(response.body.articles[0].body).toBeUndefined();
    });

    it('list_articles_filtered_by_tag_returns_matching_articles', async () => {
      const response = await request(app)
        .get('/api/articles?tag=dragons');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('Dragons Article');
    });

    it('list_articles_filtered_by_author_returns_matching_articles', async () => {
      const response = await request(app)
        .get('/api/articles?author=user1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].author.username).toBe('user1');
    });

    it('list_articles_with_limit_respects_pagination', async () => {
      const response = await request(app)
        .get('/api/articles?limit=1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articlesCount).toBe(2);
    });

    it('list_articles_with_offset_skips_articles', async () => {
      const response = await request(app)
        .get('/api/articles?limit=10&offset=1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
    });
  });

  describe('GET /api/articles/feed', () => {
    beforeEach(async () => {
      // User2 follows user1
      await request(app)
        .post('/api/profiles/user1/follow')
        .set('Authorization', `Token ${user2Token}`);

      // User1 creates article
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Feed Article',
            description: 'Should appear in feed',
            body: 'Content'
          }
        });

      // User2 creates article (should NOT appear in user2's feed)
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'Own Article',
            description: 'Own content',
            body: 'Content'
          }
        });
    });

    it('get_feed_returns_articles_from_followed_users_only', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('Feed Article');
      expect(response.body.articles[0].author.username).toBe('user1');
      expect(response.body.articles[0].body).toBeUndefined();
    });

    it('get_feed_without_auth_returns_401', async () => {
      const response = await request(app)
        .get('/api/articles/feed');

      expect(response.status).toBe(401);
    });

    it('get_feed_with_no_followed_users_returns_empty_array', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
      expect(response.body.articlesCount).toBe(0);
    });
  });
});
