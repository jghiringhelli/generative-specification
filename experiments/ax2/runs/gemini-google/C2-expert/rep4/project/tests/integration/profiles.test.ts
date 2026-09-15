import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('Profiles Endpoints Integration', () => {
  let user1Token: string;
  let user2Username: string;

  beforeEach(async () => {
    // Reset database
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Register User 1
    const user1Res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'userone',
          email: 'user1@example.com',
          password: 'password123',
        },
      });
    user1Token = user1Res.body.user.token;

    // Register User 2
    const user2Res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'usertwo',
          email: 'user2@example.com',
          password: 'password123',
        },
      });
    user2Username = user2Res.body.user.username;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/profiles/:username', () => {
    it('returns profile with following as false when unauthenticated', async () => {
      const response = await request(app).get(`/api/profiles/${user2Username}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.username).toBe(user2Username);
      expect(response.body.profile.following).toBe(false);
    });

    it('returns profile with following as false when authenticated but not following', async () => {
      const response = await request(app)
        .get(`/api/profiles/${user2Username}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe(user2Username);
      expect(response.body.profile.following).toBe(false);
    });

    it('returns 404 when profile does not exist', async () => {
      const response = await request(app).get('/api/profiles/nonexistentuser');

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.body).toContain('Profile not found');
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('returns 401 when follow is attempted without auth', async () => {
      const response = await request(app).post(`/api/profiles/${user2Username}/follow`);

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });

    it('follows target user and returns profile with following as true', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe(user2Username);
      expect(response.body.profile.following).toBe(true);

      // Verify idempotency by calling follow again
      const repeatResponse = await request(app)
        .post(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(repeatResponse.status).toBe(200);
      expect(repeatResponse.body.profile.following).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    beforeEach(async () => {
      // Establish follow relationship first
      await request(app)
        .post(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);
    });

    it('unfollows target user and returns profile with following as false', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe(user2Username);
      expect(response.body.profile.following).toBe(false);

      // Verify idempotency
      const repeatResponse = await request(app)
        .delete(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(repeatResponse.status).toBe(200);
      expect(repeatResponse.body.profile.following).toBe(false);
    });

    it('returns 401 when unfollow is attempted without auth', async () => {
      const response = await request(app).delete(`/api/profiles/${user2Username}/follow`);

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });
  });
});
