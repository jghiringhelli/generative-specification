// tests/integration/tags.test.ts
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Tags Endpoints Integration Tests', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'tags-test-secret';

    // Register user and create an article with tags
    const regRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `taguser_${Date.now()}@example.com`,
          username: `taguser_${Date.now()}`,
          password: 'Password123!'
        }
      });
    const token = regRes.body.user.token;

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article with tags for tags endpoint',
          description: 'Testing tags',
          body: 'Content for tags test',
          tagList: ['tagA', 'tagB']
        }
      });
  });

  describe('GET /api/tags', () => {
    it('should return 200 with tags array', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toBeDefined();
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags).toContain('tagA');
      expect(response.body.tags).toContain('tagB');
    });
  });
});
