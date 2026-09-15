// tests/integration/profiles.test.ts
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Profiles Endpoints Integration Tests', () => {
  let user1Token: string;
  const user1Username = `profuser1_${Date.now()}`;
  const user2Username = `profuser2_${Date.now()}`;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'profile-test-secret';

    // Register User 1
    const res1 = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${user1Username}@example.com`,
          username: user1Username,
          password: 'Password123!'
        }
      });
    user1Token = res1.body.user.token;

    // Register User 2
    await request(app)
      .post('/api/users')
      .send({
        user: {
          email: `${user2Username}@example.com`,
          username: user2Username,
          password: 'Password123!'
        }
      });
  });

  describe('GET /api/profiles/:username', () => {
    it('should return profile of existing user with following=false', async () => {
      const response = await request(app)
        .get(`/api/profiles/${user2Username}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.username).toBe(user2Username);
      expect(response.body.profile.following).toBe(false);
    });

    it('should return 404 for nonexistent user', async () => {
      const response = await request(app)
        .get('/api/profiles/nonexistent_person_123');

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user2Username}/follow`);

      expect(response.status).toBe(401);
    });

    it('should follow a user and return profile with following=true', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.username).toBe(user2Username);
      expect(response.body.profile.following).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('should unfollow a user and return profile with following=false', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.username).toBe(user2Username);
      expect(response.body.profile.following).toBe(false);
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user2Username}/follow`);

      expect(response.status).toBe(401);
    });
  });
});
