import request from 'supertest';
import { app } from '../../src/app';
import { clearDatabase, disconnectDatabase } from '../helpers/test-db';

describe('Profiles endpoints', () => {
  let bobToken: string;
  let aliceToken: string;

  beforeEach(async () => {
    await clearDatabase();

    const bobRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'bob',
          email: 'bob@example.com',
          password: 'password123'
        }
      });
    bobToken = bobRes.body.user.token;

    const aliceRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123'
        }
      });
    aliceToken = aliceRes.body.user.token;
  });

  afterAll(async () => {
    await clearDatabase();
    await disconnectDatabase();
  });

  describe('GET /api/profiles/:username', () => {
    it('returns profile with following false when viewer is unauthenticated', async () => {
      const response = await request(app).get('/api/profiles/bob');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile.username).toBe('bob');
      expect(response.body.profile.following).toBe(false);
    });

    it('returns profile with following status when viewer is authenticated', async () => {
      // First bob follows alice
      await request(app)
        .post('/api/profiles/alice/follow')
        .set('Authorization', `Token ${bobToken}`);

      // Now bob views alice profile
      const response = await request(app)
        .get('/api/profiles/alice')
        .set('Authorization', `Token ${bobToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe('alice');
      expect(response.body.profile.following).toBe(true);
    });

    it('returns 404 when profile does not exist', async () => {
      const response = await request(app).get('/api/profiles/nonexistentuser');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain("Profile 'nonexistentuser' not found");
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('returns 200 and sets following true when successfully following a user', async () => {
      const response = await request(app)
        .post('/api/profiles/alice/follow')
        .set('Authorization', `Token ${bobToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe('alice');
      expect(response.body.profile.following).toBe(true);
    });

    it('returns 200 idempotently when user is already followed', async () => {
      await request(app)
        .post('/api/profiles/alice/follow')
        .set('Authorization', `Token ${bobToken}`);

      const duplicateFollowRes = await request(app)
        .post('/api/profiles/alice/follow')
        .set('Authorization', `Token ${bobToken}`);

      expect(duplicateFollowRes.status).toBe(200);
      expect(duplicateFollowRes.body.profile.following).toBe(true);
    });

    it('returns 401 when follow is attempted without authentication token', async () => {
      const response = await request(app).post('/api/profiles/alice/follow');

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Authentication token is required');
    });

    it('returns 404 when following a non-existent profile', async () => {
      const response = await request(app)
        .post('/api/profiles/ghostuser/follow')
        .set('Authorization', `Token ${bobToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('returns 200 and sets following false when unfollowing a user', async () => {
      // Follow first
      await request(app)
        .post('/api/profiles/alice/follow')
        .set('Authorization', `Token ${bobToken}`);

      // Unfollow
      const response = await request(app)
        .delete('/api/profiles/alice/follow')
        .set('Authorization', `Token ${bobToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe('alice');
      expect(response.body.profile.following).toBe(false);
    });

    it('returns 200 idempotently when unfollowing a user not currently followed', async () => {
      const response = await request(app)
        .delete('/api/profiles/alice/follow')
        .set('Authorization', `Token ${bobToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });

    it('returns 401 when unfollow is attempted without authentication token', async () => {
      const response = await request(app).delete('/api/profiles/alice/follow');

      expect(response.status).toBe(401);
    });
  });
});
