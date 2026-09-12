import request from 'supertest';
import app from '../index';

describe('Profiles', () => {
  let user1Token: string;
  let user2Token: string;
  const user1 = {
    email: 'user1@test.com',
    username: 'user1',
    password: 'password123'
  };
  const user2 = {
    email: 'user2@test.com',
    username: 'user2',
    password: 'password123'
  };

  beforeAll(async () => {
    const res1 = await request(app).post('/api/users').send({ user: user1 });
    user1Token = res1.body.user.token;

    const res2 = await request(app).post('/api/users').send({ user: user2 });
    user2Token = res2.body.user.token;
  });

  describe('GET /api/profiles/:username', () => {
    it('should get profile without auth', async () => {
      const response = await request(app).get(`/api/profiles/${user1.username}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1.username);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/profiles/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('should follow a user', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user2.username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user2.username);
      expect(response.body.profile).toHaveProperty('following', true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).post(
        `/api/profiles/${user2.username}/follow`
      );

      expect(response.status).toBe(401);
    });

    it('should fail when trying to follow yourself', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user1.username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(422);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('should unfollow a user', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user2.username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('following', false);
    });
  });
});
