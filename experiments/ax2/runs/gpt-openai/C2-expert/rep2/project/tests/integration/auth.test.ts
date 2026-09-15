import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp({ jwtSecret: 'integration-test-secret', port: 3000 });

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function register(email = 'alice@example.com', username = 'alice') {
  return request(app).post('/api/users').send({ user: { email, username, password: 'secret' } });
}

describe('authentication endpoints', () => {
  test('registers a user and returns a token', async () => {
    const response = await register();
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: 'alice@example.com', username: 'alice' });
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  test('logs in a user with valid credentials', async () => {
    await register();
    const response = await request(app).post('/api/users/login').send({
      user: { email: 'alice@example.com', password: 'secret' },
    });
    expect(response.status).toBe(200);
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  test('returns the current user for a valid token', async () => {
    const registration = await register();
    const response = await request(app).get('/api/user')
      .set('Authorization', `Token ${registration.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('alice@example.com');
  });

  test('updates the current user', async () => {
    const registration = await register();
    const response = await request(app).put('/api/user')
      .set('Authorization', `Token ${registration.body.user.token}`)
      .send({ user: { bio: 'Writer' } });
    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('Writer');
  });

  test('returns 422 when email is already registered', async () => {
    await register();
    const response = await register('alice@example.com', 'alice-two');
    expect(response.status).toBe(422);
  });

  test('returns 422 when the password is wrong', async () => {
    await register();
    const response = await request(app).post('/api/users/login').send({
      user: { email: 'alice@example.com', password: 'wrong' },
    });
    expect(response.status).toBe(422);
  });

  test('returns 401 when getting the current user without a token', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
  });
});
