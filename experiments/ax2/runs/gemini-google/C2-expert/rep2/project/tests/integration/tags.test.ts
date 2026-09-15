import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Tags Endpoints Integration Tests', () => {
  const timestamp = Date.now();
  let userToken = '';

  const user = {
    username: `taguser_${timestamp}`,
    email: `tag_${timestamp}@example.com`,
    password: 'password123'
  };

  beforeAll(async () => {
    // Clear existing data to test empty tags state cleanly
    await prisma.favorite.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.article.deleteMany({});
    await prisma.tag.deleteMany({});

    // Register user
    const res = await request(app)
      .post('/api/users')
      .send({ user });
    userToken = res.body.user.token;
  });

  afterAll(async () => {
    await prisma.favorite.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.article.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'example.com'
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/tags', () => {
    it('returns empty array of tags when no articles exist', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tags');
      expect(response.body.tags).toEqual([]);
    });

    it('returns unique tag strings after articles with tags are created', async () => {
      // Create first article with tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: `Article One ${timestamp}`,
            description: 'First tagged article',
            body: 'Content for article one',
            tagList: ['react', 'typescript']
          }
        });

      // Create second article with overlapping and new tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: `Article Two ${timestamp}`,
            description: 'Second tagged article',
            body: 'Content for article two',
            tagList: ['typescript', 'nodejs']
          }
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tags');
      expect(response.body.tags).toEqual(expect.arrayContaining(['react', 'typescript', 'nodejs']));
      // Verify deduplication
      const typescriptOccurrences = response.body.tags.filter((t: string) => t === 'typescript').length;
      expect(typescriptOccurrences).toBe(1);
    });

    it('filters articles by tag matching persisted tags in GET /api/articles', async () => {
      const response = await request(app).get('/api/articles?tag=react');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articles');
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articles[0].tagList).toContain('react');
    });
  });
});
