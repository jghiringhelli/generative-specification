import request from 'supertest';
import { app } from '../app';
import { cleanup, createUser, createArticle } from './helpers';

describe('Tags', () => {
  afterEach(async () => {
    await cleanup();
  });

  describe('GET /api/tags', () => {
    it('should return empty array when no tags exist', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual([]);
    });

    it('should return all tags', async () => {
      const user = await createUser({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123'
      });

      await createArticle(user.id, {
        slug: 'article-1',
        title: 'Article 1',
        description: 'Test',
        body: 'Body',
        tagList: ['javascript', 'node']
      });

      await createArticle(user.id, {
        slug: 'article-2',
        title: 'Article 2',
        description: 'Test',
        body: 'Body',
        tagList: ['typescript', 'node']
      });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(['javascript', 'node', 'typescript']);
    });

    it('should not require authentication', async () => {
      const response = await request(app).get('/api/tags');
      expect(response.status).toBe(200);
    });
  });
});
