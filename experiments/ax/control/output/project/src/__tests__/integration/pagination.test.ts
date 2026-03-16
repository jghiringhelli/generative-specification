import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('Pagination Edge Cases', () => {
  let userToken: string;

  beforeAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    const userResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      });

    userToken = userResponse.body.user.token;

    // Create 25 articles for pagination testing
    for (let i = 1; i <= 25; i++) {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: `Article ${i}`,
            description: `Description ${i}`,
            body: `Body ${i}`,
            tagList: []
          }
        });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/articles pagination', () => {
    it('returns default 20 articles when no limit specified', async () => {
      const response = await request(app)
        .get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(20);
      expect(response.body.articlesCount).toBe(25);
    });

    it('respects custom limit', async () => {
      const response = await request(app)
        .get('/api/articles?limit=5');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(5);
      expect(response.body.articlesCount).toBe(25);
    });

    it('respects offset for pagination', async () => {
      const response = await request(app)
        .get('/api/articles?limit=10&offset=20');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(5); // Only 5 remaining
      expect(response.body.articlesCount).toBe(25);
    });

    it('returns empty array when offset exceeds total', async () => {
      const response = await request(app)
        .get('/api/articles?offset=100');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
      expect(response.body.articlesCount).toBe(25);
    });

    it('handles limit=0 gracefully', async () => {
      const response = await request(app)
        .get('/api/articles?limit=0');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
      expect(response.body.articlesCount).toBe(25);
    });

    it('enforces maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/articles?limit=100');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeLessThanOrEqual(25);
    });

    it('returns 422 for negative limit', async () => {
      const response = await request(app)
        .get('/api/articles?limit=-1');

      expect(response.status).toBe(422);
    });

    it('returns 422 for negative offset', async () => {
      const response = await request(app)
        .get('/api/articles?offset=-1');

      expect(response.status).toBe(422);
    });

    it('returns 422 for non-integer limit', async () => {
      const response = await request(app)
        .get('/api/articles?limit=abc');

      expect(response.status).toBe(422);
    });

    it('returns 422 for limit exceeding maximum', async () => {
      const response = await request(app)
        .get('/api/articles?limit=101');

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/feed pagination', () => {
    it('applies default pagination to feed', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articlesCount');
    });

    it('respects limit in feed', async () => {
      const response = await request(app)
        .get('/api/articles/feed?limit=5')
        .set('Authorization', `Token ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeLessThanOrEqual(5);
    });
  });
});
