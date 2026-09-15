import request from 'supertest';
import { Application } from 'express';
import { buildTestApp, prisma, resetDatabase } from './helpers';

let app: Application;

beforeAll(() => {
  app = buildTestApp();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Registers a user and returns its auth token.
 * @param username the username to register
 * @returns the issued JWT token
 */
async function registerUser(username: string): Promise<string> {
  const res = await request(app)
    .post('/api/users')
    .send({ user: { email: `${username}@example.com`, username, password: 'password123' } });
  return res.body.user.token;
}

describe('GET /api/profiles/:username', () => {
  it('returns the profile with following false when unauthenticated', async () => {
    await registerUser('celeb');
    const res = await request(app).get('/api/profiles/celeb');
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('celeb');
    expect(res.body.profile.following).toBe(false);
  });

  it('returns following true when the authenticated user follows the profile', async () => {
    await registerUser('celeb');
    const followerToken = await registerUser('fan');
    await request(app)
      .post('/api/profiles/celeb/follow')
      .set('Authorization', `Token ${followerToken}`);
    const res = await request(app)
      .get('/api/profiles/celeb')
      .set('Authorization', `Token ${followerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('returns 404 when profile does not exist', async () => {
    const res = await request(app).get('/api/profiles/ghost');
    expect(res.status).toBe(404);
    expect(res.body.errors.body).toBeDefined();
  });
});

describe('POST /api/profiles/:username/follow', () => {
  it('follows a user and returns following true', async () => {
    await registerUser('celeb');
    const token = await registerUser('fan');
    const res = await request(app)
      .post('/api/profiles/celeb/follow')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('is idempotent when following the same user twice', async () => {
    await registerUser('celeb');
    const token = await registerUser('fan');
    await request(app).post('/api/profiles/celeb/follow').set('Authorization', `Token ${token}`);
    const res = await request(app)
      .post('/api/profiles/celeb/follow')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('returns 401 when following without authentication', async () => {
    await registerUser('celeb');
    const res = await request(app).post('/api/profiles/celeb/follow');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/profiles/:username/follow', () => {
  it('unfollows a user and returns following false', async () => {
    await registerUser('celeb');
    const token = await registerUser('fan');
    await request(app).post('/api/profiles/celeb/follow').set('Authorization', `Token ${token}`);
    const res = await request(app)
      .delete('/api/profiles/celeb/follow')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it('is idempotent when unfollowing a user that is not followed', async () => {
    await registerUser('celeb');
    const token = await registerUser('fan');
    const res = await request(app)
      .delete('/api/profiles/celeb/follow')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });
});
