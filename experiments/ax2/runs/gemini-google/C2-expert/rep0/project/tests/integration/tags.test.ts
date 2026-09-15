import request from 'supertest';
import { app } from '../../src/app';
import { clearDatabase, disconnectDatabase } from '../helpers/test-db';

describe('Tags endpoints', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    await disconnectDatabase();
  });

  describe('GET /api/tags', () => {
    it('returns empty tags array when no tags exist in database', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tags');
      expect(response.body.tags).toEqual([]);
    });

    it('returns unique tag strings after articles with tags are created', async () => {
      const userRes = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'tagger',
            email: 'tagger@example.com',
            password: 'password123'
          }
        });
      const token = userRes.body.user.token;

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Desc 1',
            body: 'Body 1',
            tagList: ['typescript', 'nodejs']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Desc 2',
            body: 'Body 2',
            tagList: ['nodejs', 'express']
          }
        });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toContain('typescript');
      expect(response.body.tags).toContain('nodejs');
      expect(response.body.tags).toContain('express');
      // Ensure unique
      const countNodejs = response.body.tags.filter((t: string) => t === 'nodejs').length;
      expect(countNodejs).toBe(1);
    });

    it('filters articles by tag when queried via articles endpoint', async () => {
      const userRes = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'tagger2',
            email: 'tagger2@example.com',
            password: 'password123'
          }
        });
      const token = userRes.body.user.token;

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'React Post',
            description: 'Desc',
            body: 'Body',
            tagList: ['frontend', 'react']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Backend Post',
            description: 'Desc',
            body: 'Body',
            tagList: ['backend', 'express']
          }
        });

      const response = await request(app).get('/api/articles?tag=react');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articles[0].title).toBe('React Post');
      expect(response.body.articles[0].tagList).toContain('react');
    });
  });
});
