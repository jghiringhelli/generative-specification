import request from 'supertest';
import { createApp } from '../../src/app';
import { resetDatabase, disconnect, createUser, TestUser } from '../helpers';

const app = createApp();

describe('profile endpoints', () => {
  let alice: TestUser;
  let bob: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    alice = await createUser(app, { username: 'alice' });
    bob = await createUser(app, { username: 'bob' });
  });

  afterAll(async () => {
    await disconnect();
  });

  it('returns a profile for an unauthenticated viewer with following false', async () => {
    const response = await request(app).get(`/api/profiles/${bob.username}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBe('bob');
    expect(response.body.profile.following).toBe(false);
  });

  it('returns a profile for an authenticated viewer', async () => {
    const response = await request(app)
      .get(`/api/profiles/${bob.username}`)
      .set('Authorization', `Token ${alice.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it('returns 404 when profile does not exist', async () => {
    const response = await request(app).get('/api/profiles/ghost');
    expect(response.status).toBe(404);
    expect(response.body.errors.body).toBeInstanceOf(Array);
  });

  it('follows a user and reports following true', async () => {
    const response = await request(app)
      .post(`/api/profiles/${bob.username}/follow`)
      .set('Authorization', `Token ${alice.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it('is idempotent when following the same user twice', async () => {
    await request(app)
      .post(`/api/profiles/${bob.username}/follow`)
      .set('Authorization', `Token ${alice.token}`);
    const response = await request(app)
      .post(`/api/profiles/${bob.username}/follow`)
      .set('Authorization', `Token ${alice.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it('unfollows a user and reports following false', async () => {
    await request(app)
      .post(`/api/profiles/${bob.username}/follow`)
      .set('Authorization', `Token ${alice.token}`);
    const response = await request(app)
      .delete(`/api/profiles/${bob.username}/follow`)
      .set('Authorization', `Token ${alice.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it('is idempotent when unfollowing a user that is not followed', async () => {
    const response = await request(app)
      .delete(`/api/profiles/${bob.username}/follow`)
      .set('Authorization', `Token ${alice.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it('returns 401 when following without authentication', async () => {
    const response = await request(app).post(
      `/api/profiles/${bob.username}/follow`,
    );
    expect(response.status).toBe(401);
  });
});
