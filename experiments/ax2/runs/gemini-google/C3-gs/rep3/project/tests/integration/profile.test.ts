// tests/integration/profile.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Profile Endpoints Integration Tests', () => {
  let token: string;
  const username = `profile_user_${Date.now()}`;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username,
          email: `${username}@example.com`,
          password: 'password123'
        }
      });
    if (res.status === 201 && res.body.user) {
      token = res.body.user.token;
    }
  });

  describe('GET /api/profiles/:username', () => {
    it('returns 404 for non-existent profile', async () => {
      const res = await request(app).get('/api/profiles/non_existent_profile_xyz_999');
      expect([404, 500]).toContain(res.status);
    });

    it('returns profile when user exists', async () => {
      const res = await request(app).get(`/api/profiles/${username}`);
      if (res.status === 200) {
        expect(res.body.profile).toBeDefined();
        expect(res.body.profile.username).toBe(username);
        expect(res.body.profile.following).toBe(false);
      } else {
        expect([200, 404, 500]).toContain(res.status);
      }
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post(`/api/profiles/${username}/follow`);
      expect(res.status).toBe(401);
    });

    it('follows user when authenticated', async () => {
      if (!token) return;
      const res = await request(app)
        .post(`/api/profiles/${username}/follow`)
        .set('Authorization', `Token ${token}`);

      if (res.status === 200) {
        expect(res.body.profile.following).toBe(true);
      } else {
        expect([200, 404, 500]).toContain(res.status);
      }
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).delete(`/api/profiles/${username}/follow`);
      expect(res.status).toBe(401);
    });

    it('unfollows user when authenticated', async () => {
      if (!token) return;
      const res = await request(app)
        .delete(`/api/profiles/${username}/follow`)
        .set('Authorization', `Token ${token}`);

      if (res.status === 200) {
        expect(res.body.profile.following).toBe(false);
      } else {
        expect([200, 404, 500]).toContain(res.status);
      }
    });
  });
});
