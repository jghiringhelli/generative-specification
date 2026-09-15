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

async function register(username: string): Promise<string> {
  const response = await request(app).post('/api/users').send({
    user: {
      email: `${username}@example.com`,
      username,
      password: 'password123',
    },
  });
  return response.body.user.token;
}

describe('profile endpoints', () => {
  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
  });

  it('GET /api/profiles/:username returns a public profile', async () => {
    await register('alice');
    const response = await request(app).get('/api/profiles/alice');
    expect(response.status).toBe(200);
    expect(response.body.profile).toEqual({
      username: 'alice',
      bio: null,
      image: null,
      following: false,
    });
  });

  it('POST /api/profiles/:username/follow follows a profile', async () => {
    const viewerToken = await register('viewer');
    await register('alice');
    const response = await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${viewerToken}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it('DELETE /api/profiles/:username/follow unfollows a profile', async () => {
    const viewerToken = await register('viewer');
    await register('alice');
    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${viewerToken}`);
    const response = await request(app)
      .delete('/api/profiles/alice/follow')
      .set('Authorization', `Token ${viewerToken}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });
});
