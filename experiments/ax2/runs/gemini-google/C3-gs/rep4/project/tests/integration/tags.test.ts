import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/prisma';

const app = createApp();

describe('Tags Integration Tests', () => {
  const prefix = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  beforeAll(async () => {
    //
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: prefix } }
      });
    } catch {
      //
    }
  });

  it('GET /api/tags - returns tags list', async () => {
    // Create a user and article with unique tags
    const userRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: `${prefix}_taguser`,
          email: `${prefix}@example.com`,
          password: 'password123'
        }
      });

    if (userRes.status === 201) {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userRes.body.user.token}`)
        .send({
          article: {
            title: `${prefix} Tagged Article`,
            description: 'Desc',
            body: 'Body',
            tagList: [`${prefix}_tagA`, `${prefix}_tagB`]
          }
        });
    }

    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tags');
    expect(Array.isArray(res.body.tags)).toBe(true);
  });
});
