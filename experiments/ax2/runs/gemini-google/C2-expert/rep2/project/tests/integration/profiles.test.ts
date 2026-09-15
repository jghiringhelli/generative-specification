import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Profiles Endpoints Integration Tests', () => {
  const timestamp = Date.now();
  let user1Token = '';
  const user1 = {
    username: `profuser1_${timestamp}`,
    email: `prof1_${timestamp}@example.com`,
    password: 'password123'
  };

  const user2 = {
    username: `profuser2_${timestamp}`,
    email: `prof2_${timestamp}@example.com`,
    password: 'password123'
  };

  beforeAll(async () => {
    // Register user 1
    const res1 = await request(app)
      .post('/api/users')
      .send({ user: user1 });
    user1Token = res1.body.user.token;

    // Register user 2
    await request(app)
      .post('/api/users')
      .send({ user: user2 });
  });

  afterAll(async () => {
    await prisma.follows.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'example.com'
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/profiles/:username', () => {
    it('returns profile with following false when requester is unauthenticated', async () => {
      const response = await request(app).get(`/api/profiles/${user2.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile.username).toBe(user2.username);
      expect(response.body.profile.following).toBe(false);
    });

    it('returns 404 when profile does not exist', async () => {
      const response = await request(app).get('/api/profiles/nonexistent_profile_xyz');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('returns 401 when follow is attempted without authorization', async () => {
      const response = await request(app).post(`/api/profiles/${user2.username}/follow`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
    });

    it('successfully follows target user and returns profile with following true', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user2.username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe(user2.username);
      expect(response.body.profile.following).toBe(true);
    });

    it('returns profile with following true when viewed by authenticated follower', async () => {
      const response = await request(app)
        .get(`/api/profiles/${user2.username}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe(user2.username);
      expect(response.body.profile.following).toBe(true);
    });

    it('handles repeated follow calls idempotently without error', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user2.username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('successfully unfollows target user and returns profile with following false', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user2.username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe(user2.username);
      expect(response.body.profile.following).toBe(false);
    });

    it('handles repeated unfollow calls idempotently without error', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user2.username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });
  });
});
