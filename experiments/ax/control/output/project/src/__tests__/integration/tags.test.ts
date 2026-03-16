import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('Tag Endpoints', () => {
  let userToken: string;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    const userResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123'
        }
      });

    userToken = userResponse.body.user.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/tags', () => {
    it('returns empty array when no articles exist', async () => {
      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual([]);
    });

    it('returns all unique tags after articles are created', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Description 1',
            body: 'Body 1',
            tagList: ['javascript', 'web']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Description 2',
            body: 'Body 2',
            tagList: ['typescript', 'web']
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toHaveLength(3);
      expect(response.body.tags).toContain('javascript');
      expect(response.body.tags).toContain('typescript');
      expect(response.body.tags).toContain('web');
    });

    it('returns tags in alphabetical order', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Description',
            body: 'Body',
            tagList: ['zebra', 'apple', 'monkey']
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(['apple', 'monkey', 'zebra']);
    });

    it('does not duplicate tags across multiple articles', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Description',
            body: 'Body',
            tagList: ['react', 'frontend']
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
            tagList: ['react', 'javascript']
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toHaveLength(3);
      expect(response.body.tags.filter((t: string) => t === 'react')).toHaveLength(1);
    });

    it('includes tags from articles without duplicating across single article', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Description',
            body: 'Body',
            tagList: ['node', 'express', 'api']
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(['api', 'express', 'node']);
    });
  });

  describe('Tag filtering in GET /api/articles', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'JavaScript Article',
            description: 'JS description',
            body: 'JS body',
            tagList: ['javascript', 'programming']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'TypeScript Article',
            description: 'TS description',
            body: 'TS body',
            tagList: ['typescript', 'programming']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'React Article',
            description: 'React description',
            body: 'React body',
            tagList: ['react', 'frontend']
          }
        });
    });

    it('filters articles by specific tag', async () => {
      const response = await request(app)
        .get('/api/articles?tag=javascript');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('JavaScript Article');
      expect(response.body.articles[0].tagList).toContain('javascript');
    });

    it('filters articles by tag shared across multiple articles', async () => {
      const response = await request(app)
        .get('/api/articles?tag=programming');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(2);
      expect(response.body.articlesCount).toBe(2);
      
      const titles = response.body.articles.map((a: any) => a.title);
      expect(titles).toContain('JavaScript Article');
      expect(titles).toContain('TypeScript Article');
    });

    it('returns empty array when tag has no articles', async () => {
      const response = await request(app)
        .get('/api/articles?tag=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
      expect(response.body.articlesCount).toBe(0);
    });

    it('tag filter is case-sensitive', async () => {
      const response = await request(app)
        .get('/api/articles?tag=JavaScript');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(0);
    });

    it('returns articles with correct tag list in response', async () => {
      const response = await request(app)
        .get('/api/articles?tag=programming');

      expect(response.status).toBe(200);
      expect(response.body.articles[0].tagList).toBeInstanceOf(Array);
      expect(response.body.articles[0].tagList.length).toBeGreaterThan(0);
    });
  });

  describe('Tag persistence in article operations', () => {
    it('persists tags when creating article', async () => {
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Description',
            body: 'Body',
            tagList: ['tag1', 'tag2', 'tag3']
          }
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.article.tagList).toEqual(['tag1', 'tag2', 'tag3']);

      const getResponse = await request(app)
        .get(`/api/articles/${createResponse.body.article.slug}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.article.tagList).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('allows articles with empty tag list', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'No Tags Article',
            description: 'Description',
            body: 'Body',
            tagList: []
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.tagList).toEqual([]);
    });

    it('allows articles with no tagList field', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'No TagList Field',
            description: 'Description',
            body: 'Body'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.tagList).toEqual([]);
    });

    it('tags appear in GET /api/tags after article creation', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article with unique tags',
            description: 'Description',
            body: 'Body',
            tagList: ['uniquetag1', 'uniquetag2']
          }
        });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toContain('uniquetag1');
      expect(response.body.tags).toContain('uniquetag2');
    });

    it('maintains tags when updating article without changing tags', async () => {
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Original Title',
            description: 'Original description',
            body: 'Original body',
            tagList: ['maintag1', 'maintag2']
          }
        });

      const slug = createResponse.body.article.slug;

      const updateResponse = await request(app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Updated Title'
          }
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.article.tagList).toEqual(['maintag1', 'maintag2']);
    });
  });
});
