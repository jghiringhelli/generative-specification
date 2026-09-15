import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/prisma';

const app = createApp();

describe('Profiles Integration Tests', () => {
  const prefix = `prof_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const user1 = {
    username: `${prefix}_alice`,
    email: `${prefix}_alice@example.com`,
    password: 'password123'
  };
  const user2 = {
    username: `${prefix}_bob`,
    email: `${prefix}_bob@example.com`,
    password: 'password123'
  };

  let token1: string;

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

  it('sets up users for profile testing', async () => {
    const res1 = await request(app)
      .post('/api/users')
      .send({ user: user1 });
    expect(res1.status).toBe(201);
    token1 = res1.body.user.token;

    const res2 = await request(app)
      .post('/api/users')
      .send({ user: user2 });
    expect(res2.status).toBe(201);
  });

  it('GET /api/profiles/:username - retrieves profile anonymously', async () => {
    const res = await request(app).get(`/api/profiles/${user2.username}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('profile');
    expect(res.body.profile.username).toBe(user2.username);
    expect(res.body.profile.following).toBe(false);
  });

  it('GET /api/profiles/:username - returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/profiles/non_existent_profile_12345');
    expect(res.status).toBe(404);
  });

  it('POST /api/profiles/:username/follow - requires authentication', async () => {
    const res = await request(app).post(`/api/profiles/${user2.username}/follow`);
    expect(res.status).toBe(401);
  });

  it('POST /api/profiles/:username/follow - follows user successfully', async () => {
    const res = await request(app)
      .post(`/api/profiles/${user2.username}/follow`)
      .set('Authorization', `Token ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe(user2.username);
    expect(res.body.profile.following).toBe(true);
  });

  it('GET /api/profiles/:username - shows following: true for authenticated follower', async () => {
    const res = await request(app)
      .get(`/api/profiles/${user2.username}`)
      .set('Authorization', `Token ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('DELETE /api/profiles/:username/follow - unfollows user successfully', async () => {
    const res = await request(app)
      .delete(`/api/profiles/${user2.username}/follow`)
      .set('Authorization', `Token ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });
});
