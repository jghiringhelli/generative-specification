import request from 'supertest';
import { Express } from 'express';
import {
  buildTestApp,
  resetDatabase,
  disconnectDatabase,
  registerUser,
  authHeader
} from '../helpers/db';

describe('Profile endpoints', () => {
  let app: Express;

  beforeAll(() => {
    app = buildTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('returns a profile with following=false for an unauthenticated request', async () => {
    const celeb = await registerUser(app, { username: 'celeb' });
    const response = await request(app).get(`/api/profiles/${celeb.username}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBe('celeb');
    expect(response.body.profile.following).toBe(false);
  });

  it('returns a profile reflecting following state for an authenticated viewer', async () => {
    const celeb = await registerUser(app, { username: 'celeb' });
    const viewer = await registerUser(app, { username: 'viewer' });
    await request(app)
      .post(`/api/profiles/${celeb.username}/follow`)
      .set('Authorization', authHeader(viewer.token));
    const response = await request(app)
      .get(`/api/profiles/${celeb.username}`)
      .set('Authorization', authHeader(viewer.token));
    expect(response.body.profile.following).toBe(true);
  });

  it('follows a user and reports following=true', async () => {
    const celeb = await registerUser(app, { username: 'celeb' });
    const viewer = await registerUser(app, { username: 'viewer' });
    const response = await request(app)
      .post(`/api/profiles/${celeb.username}/follow`)
      .set('Authorization', authHeader(viewer.token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it('unfollows a user and reports following=false', async () => {
    const celeb = await registerUser(app, { username: 'celeb' });
    const viewer = await registerUser(app, { username: 'viewer' });
    await request(app)
      .post(`/api/profiles/${celeb.username}/follow`)
      .set('Authorization', authHeader(viewer.token));
    const response = await request(app)
      .delete(`/api/profiles/${celeb.username}/follow`)
      .set('Authorization', authHeader(viewer.token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it('returns 404 when profile does not exist', async () => {
    const response = await request(app).get('/api/profiles/ghost');
    expect(response.status).toBe(404);
  });

  it('returns 401 when following without authentication', async () => {
    const celeb = await registerUser(app, { username: 'celeb' });
    const response = await request(app).post(`/api/profiles/${celeb.username}/follow`);
    expect(response.status).toBe(401);
  });
});
