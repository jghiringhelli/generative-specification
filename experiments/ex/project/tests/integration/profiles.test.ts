import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Application } from 'express';
import { createApp } from '../../src/app';

describe('Profile Endpoints', () => {
  let app: Application;
  let prisma: PrismaClient;
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.userFavorite.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.articleTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Create two test users
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

  describe('GET /api/profiles/:username', () => {
    it('get_existing_profile_without_auth_returns_200_with_following_false', async () => {
      const response = await request(app)
        .get('/api/profiles/user2')
        .expect(200);

      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: false
      });
    });

    it('get_existing_profile_with_auth_not_following_returns_following_false', async () => {
      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.profile.following).toBe(false);
    });

    it('get_existing_profile_with_auth_already_following_returns_following_true', async () => {
      // User1 follows User2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.profile.following).toBe(true);
    });

    it('get_nonexistent_profile_returns_404', async () => {
      const response = await request(app)
        .get('/api/profiles/nonexistent')
        .expect(404);

      expect(response.body.errors.body).toBeDefined();
    });

    it('get_profile_with_bio_and_image_returns_complete_profile', async () => {
      // Update user2 profile
      await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          user: {
            bio: 'Test bio',
            image: 'https://example.com/avatar.jpg'
          }
        });

      const response = await request(app)
        .get('/api/profiles/user2')
        .expect(200);

      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: 'Test bio',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('follow_existing_user_returns_200_with_following_true', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: true
      });
    });

    it('follow_user_twice_is_idempotent', async () => {
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.profile.following).toBe(true);
    });

    it('follow_without_auth_returns_401', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .expect(401);

      expect(response.body.errors.body).toBeDefined();
    });

    it('follow_nonexistent_user_returns_404', async () => {
      const response = await request(app)
        .post('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(404);

      expect(response.body.errors.body).toBeDefined();
    });

    it('follow_yourself_returns_404', async () => {
      const response = await request(app)
        .post('/api/profiles/user1/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(404);

      expect(response.body.errors.body).toBeDefined();
    });

    it('follow_creates_relationship_visible_in_profile_get', async () => {
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.profile.following).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    beforeEach(async () => {
      // User1 follows User2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);
    });

    it('unfollow_followed_user_returns_200_with_following_false', async () => {
      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: false
      });
    });

    it('unfollow_twice_is_idempotent', async () => {
      await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.profile.following).toBe(false);
    });

    it('unfollow_without_auth_returns_401', async () => {
      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .expect(401);

      expect(response.body.errors.body).toBeDefined();
    });

    it('unfollow_nonexistent_user_returns_404', async () => {
      const response = await request(app)
        .delete('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(404);

      expect(response.body.errors.body).toBeDefined();
    });

    it('unfollow_removes_relationship_visible_in_profile_get', async () => {
      await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      expect(response.body.profile.following).toBe(false);
    });
  });

  describe('follow relationship isolation', () => {
    it('user1_following_user2_does_not_affect_user2_following_user1', async () => {
      // User1 follows User2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      // User2 checks User1's profile - should not be following
      const response = await request(app)
        .get('/api/profiles/user1')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      expect(response.body.profile.following).toBe(false);
    });

    it('multiple_users_can_follow_same_user', async () => {
      // User1 follows User2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`)
        .expect(200);

      // Create User3
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

      // User3 follows User2
      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user3Token}`)
        .expect(200);

      expect(response.body.profile.following).toBe(true);
    });
  });
});
