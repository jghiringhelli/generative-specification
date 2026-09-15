import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, authHeader, registerUser } from '../helpers/app';
import { resetDatabase, disconnectDatabase } from '../helpers/db';

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

describe('GET /api/profiles/:username', () => {
  it('returns a profile with following false when unauthenticated', async () => {
    const target = await registerUser(app, { username: 'celeb' });
    const response = await request(app).get(
      `/api/profiles/${target.username}`
    );
    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBe('celeb');
    expect(response.body.profile.following).toBe(false);
  });

  it('reflects the follow state when authenticated', async () => {
    const target = await registerUser(app, { username: 'celeb' });
    const follower = await registerUser(app, { username: 'fan' });
    await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    const response = await request(app)
      .get(`/api/profiles/${target.username}`)
      .set('Authorization', authHeader(follower.token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it('returns 404 when profile does not exist', async () => {
    const response = await request(app).get('/api/profiles/ghost');
    expect(response.status).toBe(404);
    expect(response.body.errors.body).toBeInstanceOf(Array);
  });
});

describe('POST /api/profiles/:username/follow', () => {
  it('follows a user and returns following true', async () => {
    const target = await registerUser(app, { username: 'celeb' });
    const follower = await registerUser(app, { username: 'fan' });
    const response = await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it('is idempotent when following an already-followed user', async () => {
    const target = await registerUser(app, { username: 'celeb' });
    const follower = await registerUser(app, { username: 'fan' });
    await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    const response = await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it('returns 401 when following without authentication', async () => {
    const target = await registerUser(app, { username: 'celeb' });
    const response = await request(app).post(
      `/api/profiles/${target.username}/follow`
    );
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/profiles/:username/follow', () => {
  it('unfollows a user and returns following false', async () => {
    const target = await registerUser(app, { username: 'celeb' });
    const follower = await registerUser(app, { username: 'fan' });
    await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    const response = await request(app)
      .delete(`/api/profiles/${target.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it('is idempotent when unfollowing a user that is not followed', async () => {
    const target = await registerUser(app, { username: 'celeb' });
    const follower = await registerUser(app, { username: 'fan' });
    const response = await request(app)
      .delete(`/api/profiles/${target.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });
});
