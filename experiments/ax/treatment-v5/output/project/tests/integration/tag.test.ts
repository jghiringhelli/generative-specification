
/**
 * Integration tests for tag endpoints.
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import type { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
});

beforeEach(async () => {
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/tags', () => {
  it('returns empty array when no tags exist', async () => {
    const response = await request(app).get('/api/tags').expect(200);

    expect(response.body.tags).toEqual([]);
  });

  it('returns all unique tags from articles', async () => {
    // Create user
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    // Create articles with tags
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'React Article',
          description: 'About React',
          body: 'React content',
          tagList: ['reactjs', 'javascript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Angular Article',
          description: 'About Angular',
          body: 'Angular content',
          tagList: ['angularjs', 'javascript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Dragons Article',
          description: 'About Dragons',
          body: 'Dragon content',
          tagList: ['dragons']
        }
      });

    // Get tags
    const response = await request(app).get('/api/tags').expect(200);

    expect(response.body.tags).toHaveLength(4);
    expect(response.body.tags).toEqual(
      expect.arrayContaining(['reactjs', 'angularjs', 'javascript', 'dragons'])
    );
  });

  it('returns tags only once even if used in multiple articles', async () => {
    // Create user
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    // Create multiple articles with same tag
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 1',
          description: 'Desc',
          body: 'Body',
          tagList: ['javascript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 2',
          description: 'Desc',
          body: 'Body',
          tagList: ['javascript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 3',
          description: 'Desc',
          body: 'Body',
          tagList: ['javascript']
        }
      });

    // Get tags
    const response = await request(app).get('/api/tags').expect(200);

    expect(response.body.tags).toEqual(['javascript']);
  });

  it('does not require authentication', async () => {
    const response = await request(app).get('/api/tags').expect(200);

    expect(response.body).toHaveProperty('tags');
  });
});
