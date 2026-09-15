import request from 'supertest';
import { createApp } from '../../src/app';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from '../../src/repositories/IUserRepository';

class FakeUserRepository implements IUserRepository {
  private users: UserEntity[] = [];

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return (
      this.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null
    );
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user: UserEntity = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: data.bio ?? '',
      image: data.image ?? '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    const existing = this.users[index];
    const updated: UserEntity = {
      ...existing,
      email: data.email ?? existing.email,
      username: data.username ?? existing.username,
      passwordHash: data.passwordHash ?? existing.passwordHash,
      bio: data.bio !== undefined ? data.bio : existing.bio,
      image: data.image !== undefined ? data.image : existing.image,
      updatedAt: new Date(),
    };
    this.users[index] = updated;
    return updated;
  }
}

describe('Auth Endpoints (Integration)', () => {
  let fakeRepo: FakeUserRepository;
  let app: any;

  beforeEach(() => {
    fakeRepo = new FakeUserRepository();
    app = createApp({ userRepository: fakeRepo });
  });

  describe('POST /api/users', () => {
    it('registers a new user and returns 201 with user object', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user.token).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('returns 422 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'invalid-email',
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'loginuser',
            email: 'login@example.com',
            password: 'password123',
          },
        });
    });

    it('authenticates user and returns 200 with token', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'password123',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.user.token).toBeDefined();
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('returns 401 on invalid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'wrongpassword',
          },
        });

      expect(res.status).toBe(401);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/user', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'currentuser',
            email: 'current@example.com',
            password: 'password123',
          },
        });
      token = res.body.user.token;
    });

    it('returns current user with valid Token auth header', async () => {
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('currentuser');
      expect(res.body.user.email).toBe('current@example.com');
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/user');

      expect(res.status).toBe(401);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/user', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'updateuser',
            email: 'update@example.com',
            password: 'password123',
          },
        });
      token = res.body.user.token;
    });

    it('updates user bio and image and returns 200', async () => {
      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'I like coding TypeScript',
            image: 'https://example.com/me.png',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('I like coding TypeScript');
      expect(res.body.user.image).toBe('https://example.com/me.png');
    });
  });
});
