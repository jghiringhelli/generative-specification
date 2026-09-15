import request from 'supertest';
import { createApp } from '../../src/app';
import { getPrismaClient } from '../../src/repositories/prisma.client';
import { clearDatabase } from '../helpers/db.helper';

describe('Profile Endpoints Integration', () => {
  const app = createApp();
  const prisma = getPrismaClient();

  let targetUsername: string;
  let followerToken: string;

  beforeEach(async () => {
    await clearDatabase(prisma);

    // Create target user
    const targetRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'author_jane',
          email: 'jane@example.com',
          password: 'password123',
        },
      });
    targetUsername = targetRes.body.user.username;

    // Create follower user
    const followerRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'reader_bob',
          email: 'bob@example.com',
          password: 'password123',
        },
      });
    followerToken = followerRes.body.user.token;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  it('returns profile with following false when unauthenticated', async () => {
    const res = await request(app).get(`/api/profiles/${targetUsername}`);

    expect(res.status).toBe(200);
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.username).toBe(targetUsername);
    expect(res.body.profile.following).toBe(false);
  });

  it('returns profile with following false when authenticated user does not follow target', async () => {
    const res = await request(app)
      .get(`/api/profiles/${targetUsername}`)
      .set('Authorization', `Token ${followerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it('follows user successfully and sets following true', async () => {
    const followRes = await request(app)
      .post(`/api/profiles/${targetUsername}/follow`)
      .set('Authorization', `Token ${followerToken}`);

    expect(followRes.status).toBe(200);
    expect(followRes.body.profile.following).toBe(true);

    const getRes = await request(app)
      .get(`/api/profiles/${targetUsername}`)
      .set('Authorization', `Token ${followerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.profile.following).toBe(true);
  });

  it('unfollows user successfully and sets following false', async () => {
    // Follow first
    await request(app)
      .post(`/api/profiles/${targetUsername}/follow`)
      .set('Authorization', `Token ${followerToken}`);

    // Unfollow
    const unfollowRes = await request(app)
      .delete(`/api/profiles/${targetUsername}/follow`)
      .set('Authorization', `Token ${followerToken}`);

    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.profile.following).toBe(false);
  });

  it('returns 404 when profile does not exist', async () => {
    const res = await request(app).get('/api/profiles/nonexistent_user_handle');

    expect(res.status).toBe(404);
    expect(res.body.errors.body).toBeDefined();
  });

  it('returns 401 when attempting to follow user without authentication', async () => {
    const res = await request(app).post(`/api/profiles/${targetUsername}/follow`);

    expect(res.status).toBe(401);
    expect(res.body.errors.body).toBeDefined();
  });
});
