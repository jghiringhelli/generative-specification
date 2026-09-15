import request from 'supertest';
import type { IPasswordHasher } from '../auth/IPasswordHasher';
import type { ITokenService, TokenPayload } from '../auth/ITokenService';
import { createApp } from '../app';
import { AuthController } from '../controllers/AuthController';
import type { CreateUserRecord, IUserRepository, UpdateUserRecord, UserRecord } from '../repositories/IUserRepository';
import { AuthService } from '../services/AuthService';

class MemoryUsers implements IUserRepository {
  private user: UserRecord | null = null;
  public findById(id: string) { return Promise.resolve(this.user?.id === id ? this.user : null); }
  public findByEmail(email: string) { return Promise.resolve(this.user?.email === email ? this.user : null); }
  public findByUsername(username: string) { return Promise.resolve(this.user?.username === username ? this.user : null); }
  public create(data: CreateUserRecord) {
    this.user = { id: 'user-1', bio: null, image: null, ...data };
    return Promise.resolve(this.user);
  }
  public update(_id: string, data: UpdateUserRecord) {
    this.user = { ...this.user!, ...data } as UserRecord;
    return Promise.resolve(this.user);
  }
}

const passwordHasher: IPasswordHasher = {
  hash: async (password) => `hash:${password}`,
  verify: async (hash, password) => hash === `hash:${password}`,
};
const tokens: ITokenService = {
  sign: ({ userId }) => `valid-${userId}`,
  verify: (token): TokenPayload => {
    if (!token.startsWith('valid-')) throw new Error('invalid');
    return { userId: token.slice(6) };
  },
};

function buildApp() {
  const service = new AuthService(new MemoryUsers(), passwordHasher, tokens);
  return createApp({ authController: new AuthController(service), tokenService: tokens });
}

const registration = { user: { email: 'alice@example.com', username: 'alice', password: 'password' } };

describe('authentication endpoints', () => {
  test('POST /api/users registers a user', async () => {
    const response = await request(buildApp()).post('/api/users').send(registration);
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: 'alice@example.com', username: 'alice' });
  });

  test('POST /api/users/login authenticates a user', async () => {
    const app = buildApp();
    await request(app).post('/api/users').send(registration);
    const response = await request(app).post('/api/users/login').send({ user: { email: 'alice@example.com', password: 'password' } });
    expect(response.status).toBe(200);
    expect(response.body.user.token).toBe('valid-user-1');
  });

  test('GET /api/user returns the current user', async () => {
    const app = buildApp();
    await request(app).post('/api/users').send(registration);
    const response = await request(app).get('/api/user').set('Authorization', 'Token valid-user-1');
    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe('alice');
  });

  test('invalid registration returns the API validation error format', async () => {
    const response = await request(buildApp()).post('/api/users').send({ user: { email: 'bad', username: '', password: 'short' } });
    expect(response.status).toBe(422);
    expect(response.body).toEqual({ errors: { body: ['Validation failed'] } });
  });

  test('GET /api/user requires authentication', async () => {
    const response = await request(buildApp()).get('/api/user');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ errors: { body: ['Authentication token is required'] } });
  });

  test('GET /api/user returns 404 when the authenticated user no longer exists', async () => {
    const response = await request(buildApp()).get('/api/user').set('Authorization', 'Token valid-missing');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ errors: { body: ['User not found'] } });
  });

  test('PUT /api/user updates the current user', async () => {
    const app = buildApp();
    await request(app).post('/api/users').send(registration);
    const response = await request(app).put('/api/user').set('Authorization', 'Token valid-user-1').send({ user: { bio: 'Writer' } });
    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('Writer');
  });
});
