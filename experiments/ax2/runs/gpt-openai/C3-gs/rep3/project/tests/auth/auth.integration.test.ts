import request from 'supertest';
import { AuthService } from '../../src/auth/AuthService';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../fixtures/InMemoryUserRepository';
import { TestPasswordHasher } from '../fixtures/TestPasswordHasher';
import { TestTokenService } from '../fixtures/TestTokenService';

function createTestApp() {
  const tokens = new TestTokenService();
  const service = new AuthService(
    new InMemoryUserRepository(),
    new TestPasswordHasher(),
    tokens,
  );
  return createApp({ authService: service, tokenService: tokens });
}

const registration = {
  user: {
    email: 'alice@example.com',
    username: 'alice',
    password: 'password123',
  },
};

describe('authentication endpoints', () => {
  test('POST /api/users registers a user', async () => {
    const response = await request(createTestApp())
      .post('/api/users')
      .send(registration)
      .expect(201);
    expect(response.body.user).toMatchObject({
      email: 'alice@example.com',
      username: 'alice',
      token: 'token-1',
    });
  });

  test('POST /api/users/login authenticates a user', async () => {
    const app = createTestApp();
    await request(app).post('/api/users').send(registration);
    const response = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'alice@example.com', password: 'password123' } })
      .expect(200);
    expect(response.body.user.token).toBe('token-1');
  });

  test('GET /api/user returns the current user', async () => {
    const app = createTestApp();
    await request(app).post('/api/users').send(registration);
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', 'Token token-1')
      .expect(200);
    expect(response.body.user.email).toBe('alice@example.com');
  });

  test('PUT /api/user updates the current user', async () => {
    const app = createTestApp();
    await request(app).post('/api/users').send(registration);
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', 'Token token-1')
      .send({ user: { bio: 'A Conduit author' } })
      .expect(200);
    expect(response.body.user.bio).toBe('A Conduit author');
  });

  test('POST /api/users returns 422 errors in the API format', async () => {
    const response = await request(createTestApp())
      .post('/api/users')
      .send({ user: { email: 'invalid', username: '', password: 'short' } })
      .expect(422);
    expect(response.body.errors.body).toEqual(expect.any(Array));
  });

  test('GET /api/user returns 401 errors in the API format', async () => {
    const response = await request(createTestApp())
      .get('/api/user')
      .expect(401);
    expect(response.body).toEqual({
      errors: { body: ['Authorization token is required'] },
    });
  });

  test('unknown routes return 404 errors in the API format', async () => {
    const response = await request(createTestApp())
      .get('/api/unknown')
      .expect(404);
    expect(response.body).toEqual({
      errors: { body: ['Route GET /api/unknown not found'] },
    });
  });
});
