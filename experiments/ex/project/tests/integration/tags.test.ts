import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Application } from 'express';
import { createApp } from '../../src/app';

describe('Tag Endpoints', () => {
  let app: Application;
  let prisma: PrismaClient;
  let userToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.userFavorite.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.articleTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const userResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user@example.com',
          username: 'testuser',
          password: 'password123'
        }
      });
    userToken = userResponse.body.user.token;
  });

  describe('GET /api/tags', () => {
    it('get_tags_with_no_articles_returns_empty_list', async () => {
      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body).toEqual({
        tags: []
      });
    });

    it('get_tags_with_articles_returns_unique_tags', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Description',
            body: 'Body',
            tagList: ['javascript', 'nodejs']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Description',
            body: 'Body',
            tagList: ['typescript', 'nodejs']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.tags).toHaveLength(3);
      expect(response.body.tags).toContain('javascript');
      expect(response.body.tags).toContain('nodejs');
      expect(response.body.tags).toContain('typescript');
    });

    it('get_tags_returns_alphabetically_sorted_tags', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article',
            description: 'Description',
            body: 'Body',
            tagList: ['zebra', 'apple', 'mongoose']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.tags).toEqual(['apple', 'mongoose', 'zebra']);
    });

    it('get_tags_does_not_require_authentication', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article',
            description: 'Description',
            body: 'Body',
            tagList: ['public']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.tags).toContain('public');
    });

    it('get_tags_returns_unique_tags_no_duplicates', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Description',
            body: 'Body',
            tagList: ['nodejs', 'testing']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Description',
            body: 'Body',
            tagList: ['nodejs', 'typescript']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      const nodejsCount = response.body.tags.filter((tag: string) => tag === 'nodejs').length;
      expect(nodejsCount).toBe(1);
    });

    it('get_tags_after_article_deletion_removes_orphaned_tags', async () => {
      const articleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Temporary Article',
            description: 'Description',
            body: 'Body',
            tagList: ['temporary']
          }
        });

      const slug = articleResponse.body.article.slug;

      await request(app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', `Token ${userToken}`)
        .expect(200);

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      // Tag should still exist in DB but not appear in the list
      // unless it's used by other articles
      expect(response.body.tags).not.toContain('temporary');
    });

    it('get_tags_only_returns_tags_actually_used_by_articles', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article',
            description: 'Description',
            body: 'Body',
            tagList: ['used']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.tags).toEqual(['used']);
    });
  });
});
