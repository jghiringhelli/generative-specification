import request from 'supertest';
import { buildTestHarness } from '../support/testApp';
import { authHeader, registerUser } from '../support/apiHelpers';

describe('Profile endpoints', () => {
  it('GET /api/profiles/:username returns a profile (200)', async () => {
    const { app } = buildTestHarness();
    await registerUser(app, { username: 'celeb', email: 'celeb@example.com' });

    const res = await request(app).get('/api/profiles/celeb');
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('celeb');
    expect(res.body.profile.following).toBe(false);
  });

  it('GET /api/profiles/:username returns 404 for unknown user', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/profiles/ghost');
    expect(res.status).toBe(404);
  });

  it('POST follow requires auth (401)', async () => {
    const { app } = buildTestHarness();
    await registerUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const res = await request(app).post('/api/profiles/celeb/follow');
    expect(res.status).toBe(401);
  });

  it('POST /api/profiles/:username/follow follows a user (200)', async () => {
    const { app } = buildTestHarness();
    await registerUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const follower = await registerUser(app, { username: 'fan', email: 'fan@example.com' });

    const res = await request(app)
      .post('/api/profiles/celeb/follow')
      .set('Authorization', authHeader(follower.token));

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('DELETE /api/profiles/:username/follow unfollows a user (200)', async () => {
    const { app } = buildTestHarness();
    await registerUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const follower = await registerUser(app, { username: 'fan', email: 'fan@example.com' });

    await request(app)
      .post('/api/profiles/celeb/follow')
      .set('Authorization', authHeader(follower.token));

    const res = await request(app)
      .delete('/api/profiles/celeb/follow')
      .set('Authorization', authHeader(follower.token));

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });
});
