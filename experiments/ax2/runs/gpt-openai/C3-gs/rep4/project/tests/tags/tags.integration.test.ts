import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';

const app = createApp({
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://unused',
  JWT_SECRET: 'integration-secret',
  JWT_EXPIRY: '7d',
  PORT: 3000,
  NODE_ENV: 'test',
});

describe('GET /api/tags', () => {
  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns unique tags used by articles', async () => {
    const registration = await request(app).post('/api/users').send({
      user: {
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      },
    });
    const token = registration.body.user.token;
    for (const title of ['First', 'Second']) {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title,
            description: 'Description',
            body: 'Body',
            tagList: ['shared', title.toLowerCase()],
          },
        });
    }

    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual(['first', 'second', 'shared']);
  });
});
