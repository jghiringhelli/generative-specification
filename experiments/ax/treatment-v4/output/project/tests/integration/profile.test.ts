import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Application } from 'express';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://conduit:conduit@localhost:5432/conduit_test'
    }
  }
});

describe('Profile Integration Tests', () => {
  let app: Application;
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    app = createApp(prisma);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');

    // Create two users for testing
    const user1Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user1@example.com',
          username: 'user1',
          password: 'password123'
        }
      });
    user1Token = user1Response.body.user.token;

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user2@example.com',
          username: 'user2',
          password: 'password123'
        }
      });
    user2Token = user2Response.body.user.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/profiles/:username', () => {
    it('get_profile_without_auth_returns_200_with_following_false', async () => {
      const response = await request(app)
        .get('/api/profiles/user2');

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: false
      });
    });

    it('get_profile_with_auth_but_not_following_returns_following_false', async () => {
      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });

    it('get_profile_with_auth_and_following_returns_following_true', async () => {
      // User1 follows user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(true);
    });

    it('get_nonexistent_profile_returns_404', async () => {
      const response = await request(app)
        .get('/api/profiles/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.errors.body[0]).toContain('not found');
    });

    it('get_profile_with_updated_bio_returns_updated_data', async () => {
      // Update user2's bio
      await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          user: {
            bio: 'I am a software developer',
            image: 'https://example.com/avatar.jpg'
          }
        });

      const response = await request(app)
        .get('/api/profiles/user2');

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: 'I am a software developer',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('follow_user_returns_200_with_following_true', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: true
      });
    });

    it('follow_already_followed_user_is_idempotent', async () => {
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(true);
    });

    it('follow_without_auth_returns_401', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow');

      expect(response.status).toBe(401);
      expect(response.body.errors.body[0]).toContain('authorization');
    });

    it('follow_nonexistent_user_returns_404', async () => {
      const response = await request(app)
        .post('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body[0]).toContain('not found');
    });

    it('follow_self_returns_422', async () => {
      const response = await request(app)
        .post('/api/profiles/user1/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('Cannot follow yourself');
    });

    it('follow_with_invalid_token_returns_401', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', 'Token invalid.token.here');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    beforeEach(async () => {
      // User1 follows user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);
    });

    it('unfollow_followed_user_returns_200_with_following_false', async () => {
      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: false
      });

      // Verify by getting profile again
      const verifyResponse = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`);

      expect(verifyResponse.body.profile.following).toBe(false);
    });

    it('unfollow_not_followed_user_is_idempotent', async () => {
      await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });

    it('unfollow_without_auth_returns_401', async () => {
      const response = await request(app)
        .delete('/api/profiles/user2/follow');

      expect(response.status).toBe(401);
      expect(response.body.errors.body[0]).toContain('authorization');
    });

    it('unfollow_nonexistent_user_returns_404', async () => {
      const response = await request(app)
        .delete('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body[0]).toContain('not found');
    });
  });

  describe('Follow relationships', () => {
    it('multiple_users_can_follow_same_user', async () => {
      // Create user3
      const user3Response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'user3@example.com',
            username: 'user3',
            password: 'password123'
          }
        });
      const user3Token = user3Response.body.user.token;

      // Both user1 and user3 follow user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user3Token}`);

      // Verify both see following = true
      const response1 = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`);

      const response3 = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user3Token}`);

      expect(response1.body.profile.following).toBe(true);
      expect(response3.body.profile.following).toBe(true);
    });

    it('follow_is_directional', async () => {
      // User1 follows user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      // User2 sees user1 as NOT following them when viewing user1's profile
      const response = await request(app)
        .get('/api/profiles/user1')
        .set('Authorization', `Token ${user2Token}`);

      expect(response.body.profile.following).toBe(false);
    });
  });
});
