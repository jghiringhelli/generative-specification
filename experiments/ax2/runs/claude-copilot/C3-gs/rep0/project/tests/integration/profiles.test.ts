import request from 'supertest';
import { buildTestHarness, registerTestUser } from '../helpers/testApp';

describe('GET /api/profiles/:username', () => {
  it('returns a profile with following=false for an anonymous viewer', async () => {
    const { app } = buildTestHarness();
    await registerTestUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const res = await request(app).get('/api/profiles/celeb');
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('celeb');
    expect(res.body.profile.following).toBe(false);
  });

  it('returns 404 for an unknown username', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/profiles/ghost');
    expect(res.status).toBe(404);
    expect(res.body.errors.body).toEqual(expect.any(Array));
  });

  it('reflects following=true when the viewer follows the target', async () => {
    const { app } = buildTestHarness();
    await registerTestUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const { token } = await registerTestUser(app, {
      username: 'fan',
      email: 'fan@example.com'
    });
    await request(app).post('/api/profiles/celeb/follow').set('Authorization', `Token ${token}`);
    const res = await request(app)
      .get('/api/profiles/celeb')
      .set('Authorization', `Token ${token}`);
    expect(res.body.profile.following).toBe(true);
  });
});

describe('POST /api/profiles/:username/follow', () => {
  it('follows a user and returns following=true', async () => {
    const { app } = buildTestHarness();
    await registerTestUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const { token } = await registerTestUser(app, {
      username: 'fan',
      email: 'fan@example.com'
    });
    const res = await request(app)
      .post('/api/profiles/celeb/follow')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('returns 401 without authentication', async () => {
    const { app } = buildTestHarness();
    await registerTestUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const res = await request(app).post('/api/profiles/celeb/follow');
    expect(res.status).toBe(401);
  });

  it('returns 404 when following an unknown user', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    const res = await request(app)
      .post('/api/profiles/ghost/follow')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/profiles/:username/follow', () => {
  it('unfollows a user and returns following=false', async () => {
    const { app } = buildTestHarness();
    await registerTestUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const { token } = await registerTestUser(app, {
      username: 'fan',
      email: 'fan@example.com'
    });
    await request(app).post('/api/profiles/celeb/follow').set('Authorization', `Token ${token}`);
    const res = await request(app)
      .delete('/api/profiles/celeb/follow')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it('returns 401 without authentication', async () => {
    const { app } = buildTestHarness();
    await registerTestUser(app, { username: 'celeb', email: 'celeb@example.com' });
    const res = await request(app).delete('/api/profiles/celeb/follow');
    expect(res.status).toBe(401);
  });
});
