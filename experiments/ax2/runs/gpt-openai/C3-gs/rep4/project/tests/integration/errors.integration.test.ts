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

describe('API error responses', () => {
  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns a standard 401 response for missing authentication', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      errors: { body: ['Authentication required'] },
    });
  });

  it('returns a standard 422 response for invalid input', async () => {
    const response = await request(app).post('/api/users').send({
      user: { email: 'invalid', username: '', password: 'short' },
    });
    expect(response.status).toBe(422);
    expect(response.body.errors.body).toEqual(expect.any(Array));
    expect(response.body.errors.body.length).toBeGreaterThan(0);
  });

  it('returns a standard 404 response for a missing resource', async () => {
    const response = await request(app).get('/api/articles/missing');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      errors: { body: ["Article 'missing' was not found"] },
    });
  });

  it('returns a standard 403 response for an ownership violation', async () => {
    const author = await register('author');
    const other = await register('other');
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author}`)
      .send({
        article: { title: 'Protected', description: 'Description', body: 'Body' },
      });
    const response = await request(app)
      .delete('/api/articles/protected')
      .set('Authorization', `Token ${other}`);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      errors: { body: ['Only the author may modify this article'] },
    });
  });

  it('returns a standard 404 response for an unknown route', async () => {
    const response = await request(app).get('/api/unknown');
    expect(response.status).toBe(404);
    expect(response.body.errors.body).toEqual(expect.any(Array));
  });
});

async function register(username: string): Promise<string> {
  const response = await request(app).post('/api/users').send({
    user: { email: `${username}@example.com`, username, password: 'password123' },
  });
  return response.body.user.token;
}
