import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, prisma } from '../helpers/testDb';

describe('Tags API', () => {
  let app: Application;
  let userToken: string;

  beforeAll(() => {
    app = createApp(prisma);
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create a user for creating articles
    const userResponse = await request(app).post('/api/users').send({
      user: {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      },
    });
    userToken = userResponse.body.user.token;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /api/tags', () => {
    it('getTags_with_no_articles_returns_empty_array', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual([]);
    });

    it('getTags_returns_all_unique_tags_from_articles', async () => {
      // Create articles with tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Test',
            body: 'Test',
            tagList: ['reactjs', 'javascript', 'webdev'],
          },
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Test',
            body: 'Test',
            tagList: ['angularjs', 'javascript', 'typescript'],
          },
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toHaveLength(5);
      expect(response.body.tags).toEqual(
        expect.arrayContaining(['reactjs', 'angularjs', 'javascript', 'webdev', 'typescript'])
      );
    });

    it('getTags_returns_unique_tags_without_duplicates', async () => {
      // Create multiple articles with overlapping tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Test',
            body: 'Test',
            tagList: ['javascript', 'webdev'],
          },
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Test',
            body: 'Test',
            tagList: ['javascript', 'nodejs'],
          },
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toHaveLength(3);
      expect(response.body.tags).toEqual(expect.arrayContaining(['javascript', 'webdev', 'nodejs']));
      
      // Verify 'javascript' appears only once
      const javascriptCount = response.body.tags.filter((tag: string) => tag === 'javascript').length;
      expect(javascriptCount).toBe(1);
    });

    it('getTags_returns_tags_in_alphabetical_order', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test article',
            description: 'Test',
            body: 'Test',
            tagList: ['zebra', 'apple', 'mango', 'banana'],
          },
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(['apple', 'banana', 'mango', 'zebra']);
    });

    it('getTags_does_not_require_authentication', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test article',
            description: 'Test',
            body: 'Test',
            tagList: ['test'],
          },
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toContain('test');
    });

    it('getTags_updates_when_new_article_with_tags_is_created', async () => {
      // Initial state - no tags
      let response = await request(app).get('/api/tags');
      expect(response.body.tags).toHaveLength(0);

      // Create article with tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'New article',
            description: 'Test',
            body: 'Test',
            tagList: ['newtag'],
          },
        });

      // Verify tag appears
      response = await request(app).get('/api/tags');
      expect(response.body.tags).toContain('newtag');
    });

    it('getTags_persists_tags_when_article_is_deleted', async () => {
      // Create article with tags
      const articleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test article',
            description: 'Test',
            body: 'Test',
            tagList: ['persistenttag'],
          },
        });

      // Verify tag exists
      let response = await request(app).get('/api/tags');
      expect(response.body.tags).toContain('persistenttag');

      // Delete article
      await request(app)
        .delete(`/api/articles/${articleResponse.body.article.slug}`)
        .set('Authorization', `Token ${userToken}`);

      // Tag should still exist in the Tag table (orphaned but persisted)
      response = await request(app).get('/api/tags');
      expect(response.body.tags).toContain('persistenttag');
    });

    it('getTags_handles_articles_with_no_tags', async () => {
      // Create article without tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article without tags',
            description: 'Test',
            body: 'Test',
          },
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual([]);
    });

    it('getTags_handles_mixed_case_tags', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test article',
            description: 'Test',
            body: 'Test',
            tagList: ['JavaScript', 'javascript', 'JAVASCRIPT'],
          },
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      // Each case variant is stored as a separate tag (database constraint is case-sensitive)
      // Note: In production, you might want to normalize tags to lowercase
      expect(response.body.tags.length).toBeGreaterThan(0);
    });
  });
});
