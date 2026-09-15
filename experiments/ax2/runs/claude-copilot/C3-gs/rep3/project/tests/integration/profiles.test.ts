import request from 'supertest';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser } from '../builders/userBuilder';

describe('Profile endpoints', () => {
  let harness: ReturnType<typeof buildTestHarness>;

  beforeEach(() => {
    harness = buildTestHarness();
  });

  describe('GET /api/profiles/:username', () => {
    it('returns a profile with following=false for anonymous viewers', async () => {
      await registerUser(harness.app, { username: 'celeb' });
      const res = await request(harness.app).get('/api/profiles/celeb');

      expect(res.status).toBe(200);
      expect(res.body.profile.username).toBe('celeb');
      expect(res.body.profile.following).toBe(false);
    });

    it('returns 404 for a missing profile', async () => {
      const res = await request(harness.app).get('/api/profiles/ghost');
      expect(res.status).toBe(404);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('follows a user when authenticated', async () => {
      const follower = await registerUser(harness.app, { username: 'follower' });
      await registerUser(harness.app, { username: 'target' });

      const res = await request(harness.app)
        .post('/api/profiles/target/follow')
        .set('Authorization', authHeader(follower.token));

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(true);
    });

    it('returns 401 without a token', async () => {
      await registerUser(harness.app, { username: 'target2' });
      const res = await request(harness.app).post('/api/profiles/target2/follow');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('unfollows a previously followed user', async () => {
      const follower = await registerUser(harness.app, { username: 'f2' });
      await registerUser(harness.app, { username: 't3' });
      await request(harness.app)
        .post('/api/profiles/t3/follow')
        .set('Authorization', authHeader(follower.token));

      const res = await request(harness.app)
        .delete('/api/profiles/t3/follow')
        .set('Authorization', authHeader(follower.token));

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(false);
    });
  });
});
