import request from 'supertest';
import { createApp } from '../src/app.js';
import type { Express } from 'express';
import type { IUserRepository, User } from '../src/repositories/IUserRepository.js';
import { AuthService } from '../src/services/AuthService.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../src/errors/AppError.js';
import { createAuthRouter } from '../src/routes/auth.routes.js';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler.js';

// §8 DRY: In-memory user repository fake — first pattern of this type in the project.
// Used in unit tests to avoid database dependency.
class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];
  private nextId = 1;

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find((u) => u.username === username) ?? null;
  }

  async findById(id: number): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async create(data: { email: string; username: string; passwordHash: string }): Promise<User> {
    const user: User = {
      id: this.nextId++,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');
    this.users[index] = { ...this.users[index], ...data, updatedAt: new Date() } as User;
    return this.users[index];
  }

  reset(): void {
    this.users = [];
    this.nextId = 1;
  }
}

function buildTestApp(repo: IUserRepository): Express {
  const app = express();
  app.use(express.json());
  const authService = new AuthService(repo);
  app.use('/api', createAuthRouter(authService));
  app.use(errorHandler);
  return app;
}

describe('Auth endpoints', () => {
  let repo: InMemoryUserRepository;
  let app: Express;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    app = buildTestApp(repo);
    // Set required env for JWT
    process.env['JWT_SECRET'] = 'test-secret-that-is-at-least-32-chars-long';
  });

  describe('POST /api/users — register', () => {
    it('returns 201 and user with token on valid registration', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'alice@example.com', password: 'password123' } });

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({
        username: 'alice',
        email: 'alice@example.com',
      });
      expect(typeof res.body.user.token).toBe('string');
      expect(res.body.user.token.length).toBeGreaterThan(0);
    });

    it('returns 422 when email is missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', password: 'password123' } });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors).toHaveProperty('body');
      expect(Array.isArray(res.body.errors.body)).toBe(true);
    });

    it('returns 422 when email is invalid format', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'not-an-email', password: 'password123' } });

      expect(res.status).toBe(422);
    });

    it('returns 422 when password is too short', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'alice@example.com', password: 'short' } });

      expect(res.status).toBe(422);
    });

    it('returns 422 when email is already registered', async () => {
      await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'alice@example.com', password: 'password123' } });

      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice2', email: 'alice@example.com', password: 'password123' } });

      expect(res.status).toBe(422);
      expect(res.body.errors.body).toContain('email is already taken');
    });

    it('returns 422 when username is already taken', async () => {
      await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'alice@example.com', password: 'password123' } });

      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'alice2@example.com', password: 'password123' } });

      expect(res.status).toBe(422);
      expect(res.body.errors.body).toContain('username is already taken');
    });
  });

  describe('POST /api/users/login — login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'alice@example.com', password: 'password123' } });
    });

    it('returns 200 and user with token on valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'alice@example.com', password: 'password123' } });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('alice@example.com');
      expect(typeof res.body.user.token).toBe('string');
    });

    it('returns 401 when password is wrong', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'alice@example.com', password: 'wrongpassword' } });

      expect(res.status).toBe(401);
      expect(res.body.errors.body).toEqual(['Invalid email or password']);
    });

    it('returns 401 when email does not exist', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'nobody@example.com', password: 'password123' } });

      expect(res.status).toBe(401);
    });

    it('returns 422 when email is missing', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ user: { password: 'password123' } });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/user — get current user', () => {
    it('returns 200 and current user when authenticated', async () => {
      const registerRes = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'alice@example.com', password: 'password123' } });

      const token = registerRes.body.user.token;
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('alice@example.com');
    });

    it('returns 401 when no token provided', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token invalid.jwt.token');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user — update user', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ user: { username: 'alice', email: 'alice@example.com', password: 'password123' } });
      token = res.body.user.token;
    });

    it('returns 200 and updated user on valid update', async () => {
      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({ user: { bio: 'Hello world' } });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('Hello world');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .put('/api/user')
        .send({ user: { bio: 'Hello world' } });
      expect(res.status).toBe(401);
    });

    it('returns 422 when email format is invalid', async () => {
      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({ user: { email: 'not-an-email' } });
      expect(res.status).toBe(422);
    });
  });
});
