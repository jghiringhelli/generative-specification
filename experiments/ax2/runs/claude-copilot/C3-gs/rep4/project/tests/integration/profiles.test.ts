import request from 'supertest';
import { Application } from 'express';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser } from '../helpers/api';

describe('Profile endpoints', () => {
  let app: Application;

  beforeEach(() => {
    app = buildTestHarness().app;
  });

  it('GET /api/profiles/:username returns a profile', async () => {
    await registerUser(app, 'celeste', 'celeste@example.com');
    const res = await request(app).get('/api/profiles/celeste');
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('celeste');
    expect(res.body.profile.following).toBe(false);
  });

  it('GET /api/profiles/:username returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/profiles/nobody');
    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/profiles/:username/follow follows a user', async () => {
    const viewer = await registerUser(app, 'viewer', 'viewer@example.com');
    await registerUser(app, 'target', 'target@example.com');
    const res = await request(app)
      .post('/api/profiles/target/follow')
      .set('Authorization', authHeader(viewer.token));
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('DELETE /api/profiles/:username/follow unfollows a user', async () => {
    const viewer = await registerUser(app, 'viewer2', 'viewer2@example.com');
    await registerUser(app, 'target2', 'target2@example.com');
    await request(app)
      .post('/api/profiles/target2/follow')
      .set('Authorization', authHeader(viewer.token));
    const res = await request(app)
      .delete('/api/profiles/target2/follow')
      .set('Authorization', authHeader(viewer.token));
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it('follow requires authentication (401)', async () => {
    await registerUser(app, 'target3', 'target3@example.com');
    const res = await request(app).post('/api/profiles/target3/follow');
    expect(res.status).toBe(401);
  });

  it('reflects following state on GET after following', async () => {
    const viewer = await registerUser(app, 'viewer4', 'viewer4@example.com');
    await registerUser(app, 'target4', 'target4@example.com');
    await request(app)
      .post('/api/profiles/target4/follow')
      .set('Authorization', authHeader(viewer.token));
    const res = await request(app)
      .get('/api/profiles/target4')
      .set('Authorization', authHeader(viewer.token));
    expect(res.body.profile.following).toBe(true);
  });
});
