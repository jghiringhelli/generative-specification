import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('Profile Endpoints', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Username: string;
  let user2Username: string;

  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    const user1Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123'
        }
      });

    user1Token = user1Response.body.user.token;
    user1Username = user1Response.body.user.username;

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'janedoe',
          email: 'jane@example.com',
          password: 'password123'
        }
      });

    user2Token = user2Response.body.user.token;
    user2Username = user2Response.body.user.username;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/profiles/:username', () => {
    it('returns profile when unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/profiles/${user1Username}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('bio', null);
      expect(response.body.profile).toHaveProperty('image', null);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('returns profile with following false when authenticated but not following', async () => {
      const response = await request(app)
        .get(`/api/profiles/${user1Username}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('returns profile with following true when authenticated and following', async () => {
      await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .get(`/api/profiles/${user1Username}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('following', true);
    });

    it('returns 404 when profile does not exist', async () => {
      const response = await request(app)
        .get('/api/profiles/nonexistentuser');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('includes bio and image when user has them', async () => {
      await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          user: {
            bio: 'I love coding',
            image: 'https://example.com/avatar.jpg'
          }
        });

      const response = await request(app)
        .get(`/api/profiles/${user1Username}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('bio', 'I love coding');
      expect(response.body.profile).toHaveProperty('image', 'https://example.com/avatar.jpg');
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('follows a user successfully', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('following', true);
    });

    it('is idempotent when already following', async () => {
      await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('following', true);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user1Username}/follow`);

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Unauthorized');
    });

    it('returns 404 when user to follow does not exist', async () => {
      const response = await request(app)
        .post('/api/profiles/nonexistentuser/follow')
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('returns 422 when trying to follow yourself', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Cannot follow yourself');
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);
    });

    it('unfollows a user successfully', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('is idempotent when not following', async () => {
      await request(app)
        .delete(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .delete(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user1Username}/follow`);

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Unauthorized');
    });

    it('returns 404 when user to unfollow does not exist', async () => {
      const response = await request(app)
        .delete('/api/profiles/nonexistentuser/follow')
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('verifies following status changes after unfollow', async () => {
      await request(app)
        .delete(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .get(`/api/profiles/${user1Username}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('following', false);
    });
  });
});
