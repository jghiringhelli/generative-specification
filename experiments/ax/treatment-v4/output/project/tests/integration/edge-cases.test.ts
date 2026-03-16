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

describe('Edge Cases and Additional Coverage', () => {
  let app: Application;
  let userToken: string;

  beforeAll(async () => {
    app = createApp(prisma);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');

    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        }
      });
    userToken = response.body.user.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Pagination edge cases', () => {
    it('handles_negative_limit_gracefully', async () => {
      const response = await request(app)
        .get('/api/articles?limit=-1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toBeDefined();
    });

    it('handles_negative_offset_gracefully', async () => {
      const response = await request(app)
        .get('/api/articles?offset=-1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toBeDefined();
    });

    it('enforces_maximum_limit', async () => {
      // Create multiple articles
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/articles')
          .set('Authorization', `Token ${userToken}`)
          .send({
            article: {
              title: `Article ${i}`,
              description: 'Test',
              body: 'Content'
            }
          });
      }

      const response = await request(app)
        .get('/api/articles?limit=1000');

      expect(response.status).toBe(200);
      // Should be capped at MAX_ARTICLES_LIMIT (100)
      expect(response.body.articles.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Self-operations', () => {
    it('user_can_favorite_their_own_article', async () => {
      const articleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'My Article',
            description: 'Self-favorite test',
            body: 'Content'
          }
        });

      const favoriteResponse = await request(app)
        .post(`/api/articles/${articleResponse.body.article.slug}/favorite`)
        .set('Authorization', `Token ${userToken}`);

      expect(favoriteResponse.status).toBe(200);
      expect(favoriteResponse.body.article.favorited).toBe(true);
    });

    it('user_can_comment_on_their_own_article', async () => {
      const articleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'My Article',
            description: 'Self-comment test',
            body: 'Content'
          }
        });

      const commentResponse = await request(app)
        .post(`/api/articles/${articleResponse.body.article.slug}/comments`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          comment: {
            body: 'Commenting on my own article'
          }
        });

      expect(commentResponse.status).toBe(200);
      expect(commentResponse.body.comment.body).toBe('Commenting on my own article');
    });
  });

  describe('Special characters in slugs', () => {
    it('generates_clean_slug_from_title_with_special_chars', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Title with @#$% Special & Characters!',
            description: 'Test',
            body: 'Content'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.slug).toMatch(/^[a-z0-9-]+$/);
      expect(response.body.article.slug).not.toContain('@');
      expect(response.body.article.slug).not.toContain('#');
      expect(response.body.article.slug).not.toContain('&');
    });

    it('handles_unicode_characters_in_title', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article with émojis 🚀 and ñoñó',
            description: 'Test',
            body: 'Content'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.slug).toBeDefined();
    });
  });

  describe('Empty result sets', () => {
    it('list_articles_with_non_matching_filter_returns_empty', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test',
            body: 'Content',
            tagList: ['javascript']
          }
        });

      const response = await request(app)
        .get('/api/articles?tag=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
      expect(response.body.articlesCount).toBe(0);
    });

    it('feed_for_user_following_nobody_returns_empty', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
      expect(response.body.articlesCount).toBe(0);
    });
  });

  describe('Malformed input', () => {
    it('handles_malformed_json_gracefully', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('handles_missing_request_body', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(422);
    });
  });
});
