import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp({ jwtSecret: 'integration-test-secret', port: 3000 });

beforeEach(async () => {
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function register(email: string, username: string) {
  return request(app).post('/api/users').send({ user: { email, username, password: 'secret' } });
}

describe('profile endpoints', () => {
  test('gets a profile without authentication', async () => {
    await register('alice@example.com', 'alice');
    const response = await request(app).get('/api/profiles/alice');
    expect(response.status).toBe(200);
    expect(response.body.profile).toEqual({ username: 'alice', bio: null, image: null, following: false });
  });

  test('gets a profile with authentication', async () => {
    const alice = await register('alice@example.com', 'alice');
    await register('bob@example.com', 'bob');
    const response = await request(app).get('/api/profiles/bob')
      .set('Authorization', `Token ${alice.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  test('follows a user', async () => {
    const alice = await register('alice@example.com', 'alice');
    await register('bob@example.com', 'bob');
    const response = await request(app).post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${alice.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  test('unfollows a user', async () => {
    const alice = await register('alice@example.com', 'alice');
    await register('bob@example.com', 'bob');
    await request(app).post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${alice.body.user.token}`);
    const response = await request(app).delete('/api/profiles/bob/follow')
      .set('Authorization', `Token ${alice.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  test('returns 404 when profile does not exist', async () => {
    const response = await request(app).get('/api/profiles/missing');
    expect(response.status).toBe(404);
  });

  test('returns 401 when following without authentication', async () => {
    await register('bob@example.com', 'bob');
    const response = await request(app).post('/api/profiles/bob/follow');
    expect(response.status).toBe(401);
  });
});
