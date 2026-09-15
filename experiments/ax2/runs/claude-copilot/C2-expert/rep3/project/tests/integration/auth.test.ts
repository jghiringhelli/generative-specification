import request from 'supertest';
import { createApp } from '../../src/app';
import { resetDatabase, disconnect } from '../helpers';

const app = createApp();

const validUser = {
  email: 'jake@jake.jake',
  username: 'jake',
  password: 'jakejake',
};

async function registerUser(): Promise<string> {
  const response = await request(app)
    .post('/api/users')
    .send({ user: validUser });
  return response.body.user.token as string;
}

describe('authentication endpoints', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnect();
  });

  it('registers a new user and returns a token', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ user: validUser });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(validUser.email);
    expect(response.body.user.username).toBe(validUser.username);
    expect(typeof response.body.user.token).toBe('string');
    expect(response.body.user.password).toBeUndefined();
  });

  it('returns 422 when email is already registered', async () => {
    await registerUser();
    const response = await request(app)
      .post('/api/users')
      .send({ user: { ...validUser, username: 'different' } });

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toBeInstanceOf(Array);
  });

  it('returns 422 when registration body is invalid', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ user: { email: 'not-an-email', username: '', password: '' } });

    expect(response.status).toBe(422);
    expect(response.body.errors.body.length).toBeGreaterThan(0);
  });

  it('logs in an existing user with correct credentials', async () => {
    await registerUser();
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: validUser.email, password: validUser.password } });

    expect(response.status).toBe(200);
    expect(response.body.user.token).toBeDefined();
  });

  it('returns 422 when logging in with the wrong password', async () => {
    await registerUser();
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: validUser.email, password: 'wrong' } });

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toBeInstanceOf(Array);
  });

  it('returns the current user for a valid token', async () => {
    const token = await registerUser();
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(validUser.email);
  });

  it('returns 401 when getting the current user without a token', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
    expect(response.body.errors.body).toBeInstanceOf(Array);
  });

  it('updates the authenticated user', async () => {
    const token = await registerUser();
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'I like to code', email: 'jake@updated.com' } });

    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('I like to code');
    expect(response.body.user.email).toBe('jake@updated.com');
  });

  it('returns 401 when updating the user without a token', async () => {
    const response = await request(app)
      .put('/api/user')
      .send({ user: { bio: 'nope' } });
    expect(response.status).toBe(401);
  });
});
