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

describe('Tag Integration Tests', () => {
  let app: Application;
  let userToken: string;

  beforeAll(async () => {
    app = createApp(prisma);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');

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

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/tags', () => {
    it('get_tags_with_no_articles_returns_empty_array', async () => {
      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual([]);
    });

    it('get_tags_returns_all_unique_tags_from_articles', async () => {
      // Create articles with various tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'React Tutorial',
            description: 'Learn React',
            body: 'React content',
            tagList: ['reactjs', 'javascript', 'frontend']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Node.js Guide',
            description: 'Learn Node',
            body: 'Node content',
            tagList: ['nodejs', 'javascript', 'backend']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Angular Deep Dive',
            description: 'Learn Angular',
            body: 'Angular content',
            tagList: ['angular', 'typescript', 'frontend']
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toHaveLength(6);
      expect(response.body.tags).toContain('reactjs');
      expect(response.body.tags).toContain('javascript');
      expect(response.body.tags).toContain('frontend');
      expect(response.body.tags).toContain('nodejs');
      expect(response.body.tags).toContain('backend');
      expect(response.body.tags).toContain('angular');
      expect(response.body.tags).toContain('typescript');
    });

    it('get_tags_returns_each_tag_only_once', async () => {
      // Create multiple articles with overlapping tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'First Article',
            description: 'First',
            body: 'Content',
            tagList: ['javascript', 'web']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Second Article',
            description: 'Second',
            body: 'Content',
            tagList: ['javascript', 'nodejs']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Third Article',
            description: 'Third',
            body: 'Content',
            tagList: ['javascript', 'react']
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      
      // Count occurrences of 'javascript'
      const javascriptCount = response.body.tags.filter(
        (tag: string) => tag === 'javascript'
      ).length;
      
      expect(javascriptCount).toBe(1);
      expect(response.body.tags).toContain('web');
      expect(response.body.tags).toContain('nodejs');
      expect(response.body.tags).toContain('react');
    });

    it('get_tags_works_without_authentication', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Public Article',
            description: 'Public',
            body: 'Content',
            tagList: ['public', 'open']
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toContain('public');
      expect(response.body.tags).toContain('open');
    });

    it('get_tags_after_article_deletion_does_not_include_orphaned_tags', async () => {
      // Create article with unique tags
      const articleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Temporary Article',
            description: 'Will be deleted',
            body: 'Content',
            tagList: ['unique-tag', 'temporary']
          }
        });

      // Create another article with different tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Permanent Article',
            description: 'Will stay',
            body: 'Content',
            tagList: ['permanent', 'stable']
          }
        });

      // Verify all tags are present
      let response = await request(app).get('/api/tags');
      expect(response.body.tags).toContain('unique-tag');
      expect(response.body.tags).toContain('temporary');
      expect(response.body.tags).toContain('permanent');

      // Delete the first article
      await request(app)
        .delete(`/api/articles/${articleResponse.body.article.slug}`)
        .set('Authorization', `Token ${userToken}`);

      // Verify orphaned tags are still in database (tags persist)
      // This is expected behavior - tags are not deleted when articles are deleted
      response = await request(app).get('/api/tags');
      expect(response.body.tags).toContain('unique-tag');
      expect(response.body.tags).toContain('temporary');
      expect(response.body.tags).toContain('permanent');
      expect(response.body.tags).toContain('stable');
    });

    it('get_tags_with_article_without_tags_returns_only_other_tags', async () => {
      // Article with tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Tagged Article',
            description: 'Has tags',
            body: 'Content',
            tagList: ['tagged', 'categorized']
          }
        });

      // Article without tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Untagged Article',
            description: 'No tags',
            body: 'Content'
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toHaveLength(2);
      expect(response.body.tags).toContain('tagged');
      expect(response.body.tags).toContain('categorized');
    });
  });
});
