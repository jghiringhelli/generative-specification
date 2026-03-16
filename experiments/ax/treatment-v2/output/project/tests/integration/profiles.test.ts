import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, prisma } from '../helpers/testDb';

describe('Profiles API', () => {
  let app: Application;
  let jakeToken: string;
  let janeToken: string;

  beforeAll(() => {
    app = createApp(prisma);
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create two users for testing
    const jakeResponse = await request(app).post('/api/users').send({
      user: {
        email: 'jake@jake.jake',
        username: 'jake',
        password: 'jakejake',
      },
    });
    jakeToken = jakeResponse.body.user.token;

    const janeResponse = await request(app).post('/api/users').send({
      user: {
        email: 'jane@jane.jane',
        username: 'jane',
        password: 'janejane',
      },
    });
    janeToken = janeResponse.body.user.token;

    // Update jake's profile
    await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${jakeToken}`)
      .send({
        user: {
          bio: 'I work at statefarm',
          image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
        },
      });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /api/profiles/:username', () => {
    it('getProfile_without_auth_returns_200_and_profile_with_following_false', async () => {
      const response = await request(app).get('/api/profiles/jake');

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'jake',
        bio: 'I work at statefarm',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
        following: false,
      });
    });

    it('getProfile_with_auth_but_not_following_returns_following_false', async () => {
      const response = await request(app)
        .get('/api/profiles/jake')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });

    it('getProfile_with_auth_and_following_returns_following_true', async () => {
      // Jane follows jake
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      const response = await request(app)
        .get('/api/profiles/jake')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'jake',
        bio: 'I work at statefarm',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
        following: true,
      });
    });

    it('getProfile_with_nonexistent_username_returns_404', async () => {
      const response = await request(app).get('/api/profiles/nobody');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('getProfile_returns_null_bio_and_image_when_not_set', async () => {
      const response = await request(app).get('/api/profiles/jane');

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'jane',
        bio: null,
        image: null,
        following: false,
      });
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('followUser_with_valid_auth_returns_200_and_profile_with_following_true', async () => {
      const response = await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'jake',
        bio: 'I work at statefarm',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
        following: true,
      });
    });

    it('followUser_without_auth_returns_401', async () => {
      const response = await request(app).post('/api/profiles/jake/follow');

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('missing authorization header');
    });

    it('followUser_with_nonexistent_user_returns_404', async () => {
      const response = await request(app)
        .post('/api/profiles/nobody/follow')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('followUser_when_already_following_is_idempotent', async () => {
      // First follow
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      // Second follow (should not error)
      const response = await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(true);
    });

    it('followUser_persists_follow_relationship', async () => {
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      // Verify by getting profile
      const response = await request(app)
        .get('/api/profiles/jake')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.body.profile.following).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    beforeEach(async () => {
      // Jane follows jake for unfollow tests
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);
    });

    it('unfollowUser_with_valid_auth_returns_200_and_profile_with_following_false', async () => {
      const response = await request(app)
        .delete('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'jake',
        bio: 'I work at statefarm',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
        following: false,
      });
    });

    it('unfollowUser_without_auth_returns_401', async () => {
      const response = await request(app).delete('/api/profiles/jake/follow');

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('missing authorization header');
    });

    it('unfollowUser_with_nonexistent_user_returns_404', async () => {
      const response = await request(app)
        .delete('/api/profiles/nobody/follow')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('unfollowUser_when_not_following_is_idempotent', async () => {
      // First unfollow
      await request(app)
        .delete('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      // Second unfollow (should not error)
      const response = await request(app)
        .delete('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });

    it('unfollowUser_persists_unfollow_relationship', async () => {
      await request(app)
        .delete('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      // Verify by getting profile
      const response = await request(app)
        .get('/api/profiles/jake')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.body.profile.following).toBe(false);
    });
  });

  describe('Follow relationships are user-specific', () => {
    let bobToken: string;

    beforeEach(async () => {
      const bobResponse = await request(app).post('/api/users').send({
        user: {
          email: 'bob@bob.bob',
          username: 'bob',
          password: 'bobbob',
        },
      });
      bobToken = bobResponse.body.user.token;
    });

    it('follows_are_independent_per_user', async () => {
      // Jane follows jake
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      // Bob does not follow jake
      const bobResponse = await request(app)
        .get('/api/profiles/jake')
        .set('Authorization', `Token ${bobToken}`);

      expect(bobResponse.body.profile.following).toBe(false);

      // Jane still follows jake
      const janeResponse = await request(app)
        .get('/api/profiles/jake')
        .set('Authorization', `Token ${janeToken}`);

      expect(janeResponse.body.profile.following).toBe(true);
    });
  });
});
