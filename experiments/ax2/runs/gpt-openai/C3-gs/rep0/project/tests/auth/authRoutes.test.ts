import express from 'express';
import request from 'supertest';
import { AuthService } from '../../src/auth/AuthService';
import { createAuthRouter } from '../../src/auth/authRoutes';
import { errorHandler } from '../../src/http/errorHandler';
import { IUserRepository, UserRecord } from '../../src/repositories/IUserRepository';

const record: UserRecord = {
  id: 'user-1', email: 'alice@example.com', username: 'alice',
  passwordHash: '', bio: null, image: null,
};

describe('authentication endpoints', () => {
  const users: jest.Mocked<IUserRepository> = {
    findById: jest.fn(), findByEmail: jest.fn(), findByUsername: jest.fn(),
    create: jest.fn(), update: jest.fn(),
  };
  const auth = new AuthService(users, 'a-secret-with-at-least-thirty-two-characters');
  const app = express().use(express.json()).use('/api', createAuthRouter(auth)).use(errorHandler);

  beforeEach(() => jest.clearAllMocks());

  test('POST /api/users registers', async () => {
    users.create.mockImplementation(async (input) => ({ ...record, ...input }));
    await request(app).post('/api/users').send({
      user: { email: record.email, username: record.username, password: 'password123' },
    }).expect(201).expect(({ body }) => expect(body.user.token).toBeDefined());
  });

  test('POST /api/users/login logs in', async () => {
    const argon2 = await import('argon2');
    users.findByEmail.mockResolvedValue({ ...record, passwordHash: await argon2.hash('password123') });
    await request(app).post('/api/users/login').send({
      user: { email: record.email, password: 'password123' },
    }).expect(200);
  });

  test('GET /api/user requires authentication', async () => {
    await request(app).get('/api/user').expect(401);
  });

  test('PUT /api/user updates the current user', async () => {
    users.create.mockResolvedValue(record);
    users.findById.mockResolvedValue(record);
    users.update.mockResolvedValue({ ...record, bio: 'Writer' });
    const registered = await auth.register({
      email: record.email, username: record.username, password: 'password123',
    });
    await request(app).put('/api/user').set('Authorization', `Token ${registered.token}`)
      .send({ user: { bio: 'Writer' } }).expect(200)
      .expect(({ body }) => expect(body.user.bio).toBe('Writer'));
  });
});
