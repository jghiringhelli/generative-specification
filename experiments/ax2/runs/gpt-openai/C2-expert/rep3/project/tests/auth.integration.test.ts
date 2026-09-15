import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

const user = { username: 'alice', email: 'alice@example.com', password: 'secret' };

beforeAll(() => { process.env.JWT_SECRET = 'integration-test-secret'; });
beforeEach(async () => { await prisma.user.deleteMany(); });
afterAll(async () => { await prisma.$disconnect(); });

describe('authentication endpoints', () => {
  it('registers a user successfully', async () => {
    const response = await request(app).post('/api/users').send({ user });
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(user.email);
  });

  it('logs in with valid credentials', async () => {
    await request(app).post('/api/users').send({ user });
    const response = await request(app).post('/api/users/login').send({ user: { email: user.email, password: user.password } });
    expect(response.status).toBe(200);
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it('gets the current user with a valid token', async () => {
    const registration = await request(app).post('/api/users').send({ user });
    const response = await request(app).get('/api/user').set('Authorization', `Token ${registration.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe(user.username);
  });

  it('updates the authenticated user', async () => {
    const registration = await request(app).post('/api/users').send({ user });
    const response = await request(app).put('/api/user').set('Authorization', `Token ${registration.body.user.token}`).send({ user: { bio: 'Writer' } });
    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('Writer');
  });

  it('returns 422 when email is already registered', async () => {
    await request(app).post('/api/users').send({ user });
    const response = await request(app).post('/api/users').send({ user: { ...user, username: 'other' } });
    expect(response.status).toBe(422);
  });

  it('returns 422 when login password is wrong', async () => {
    await request(app).post('/api/users').send({ user });
    const response = await request(app).post('/api/users/login').send({ user: { email: user.email, password: 'wrong' } });
    expect(response.status).toBe(422);
  });

  it('returns 401 when getting a user without a token', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
  });
});
