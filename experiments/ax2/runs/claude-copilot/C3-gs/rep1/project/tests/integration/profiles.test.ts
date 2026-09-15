import request from 'supertest';
import { buildTestHarness } from '../helpers/testHarness';
import { authHeader, registerUser } from '../helpers/apiClient';

describe('Profile endpoints', () => {
  it('GET /api/profiles/:username returns a profile', async () => {
    const { app } = buildTestHarness();
    await registerUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const response = await request(app).get('/api/profiles/celeb');
    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBe('celeb');
    expect(response.body.profile.following).toBe(false);
  });

  it('GET /api/profiles/:username returns 404 for an unknown user', async () => {
    const { app } = buildTestHarness();
    const response = await request(app).get('/api/profiles/ghost');
    expect(response.status).toBe(404);
  });

  it('POST /api/profiles/:username/follow follows a user', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app, { username: 'alice', email: 'alice@example.com' });
    await registerUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const response = await request(app)
      .post('/api/profiles/celeb/follow')
      .set('Authorization', authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it('DELETE /api/profiles/:username/follow unfollows a user', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app, { username: 'alice', email: 'alice@example.com' });
    await registerUser(app, { username: 'celeb', email: 'celeb@example.com' });
    await request(app).post('/api/profiles/celeb/follow').set('Authorization', authHeader(token));
    const response = await request(app)
      .delete('/api/profiles/celeb/follow')
      .set('Authorization', authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it('POST /api/profiles/:username/follow requires authentication', async () => {
    const { app } = buildTestHarness();
    await registerUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const response = await request(app).post('/api/profiles/celeb/follow');
    expect(response.status).toBe(401);
  });
});
