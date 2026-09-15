import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('Tags Endpoints Integration', () => {
  let userToken: string;

  beforeEach(async () => {
    // Clean database before each test run
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Register a user for article creation
    const userRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'tagauthor',
          email: 'tagauthor@example.com',
          password: 'password123',
        },
      });
    userToken = userRes.body.user.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/tags', () => {
    it('returns empty array when no tags or articles exist in the database', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toBeDefined();
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags.length).toBe(0);
    });

    it('returns list of unique tags after articles with tags are created', async () => {
      // Create first article with tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'First Tagged Article',
            description: 'Description 1',
            body: 'Body 1',
            tagList: ['angularjs', 'reactjs'],
          },
        });

      // Create second article with overlapping tags
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Second Tagged Article',
            description: 'Description 2',
            body: 'Body 2',
            tagList: ['reactjs', 'vuejs'],
          },
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toBeDefined();
      expect(response.body.tags).toHaveLength(3);
      expect(response.body.tags).toEqual(
        expect.arrayContaining(['angularjs', 'reactjs', 'vuejs'])
      );
    });

    it('filters articles by tag matching persisted tags', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'React Deep Dive',
            description: 'React overview',
            body: 'React content',
            tagList: ['reactjs'],
          },
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Vue Deep Dive',
            description: 'Vue overview',
            body: 'Vue content',
            tagList: ['vuejs'],
          },
        });

      const filterResponse = await request(app).get('/api/articles?tag=reactjs');

      expect(filterResponse.status).toBe(200);
      expect(filterResponse.body.articlesCount).toBe(1);
      expect(filterResponse.body.articles[0].title).toBe('React Deep Dive');
      expect(filterResponse.body.articles[0].tagList).toContain('reactjs');
    });
  });
});
