// tests/unit/AuthService.test.ts
import { AuthService } from '../../src/services/AuthService';
import { IUserRepository, UserEntity, CreateUserData, UpdateUserData } from '../../src/repositories/IUserRepository';
import { ValidationError, NotFoundError } from '../../src/errors/AppError';
import argon2 from 'argon2';
import pkg from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config/env';

const { verify } = pkg;

class MockUserRepository implements IUserRepository {
  private users: UserEntity[] = [];

  public async findById(id: string): Promise<UserEntity | null> {
    return this.users.find(u => u.id === id) || null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find(u => u.email === email) || null;
  }

  public async findByUsername(username: string): Promise<UserEntity | null> {
    return this.users.find(u => u.username === username) || null;
  }

  public async create(data: CreateUserData): Promise<UserEntity> {
    const user: UserEntity = {
      id: `user-${Date.now()}-${Math.random()}`,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: data.bio ?? null,
      image: data.image ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  public async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    const existing = this.users[index];
    const updated: UserEntity = {
      ...existing,
      ...(data.email !== undefined && { email: data.email }),
      ...(data.username !== undefined && { username: data.username }),
      ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.image !== undefined && { image: data.image }),
      updatedAt: new Date()
    };
    this.users[index] = updated;
    return updated;
  }
}

describe('AuthService', () => {
  let userRepository: MockUserRepository;
  let authService: AuthService;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    authService = new AuthService(userRepository);
  });

  describe('register', () => {
    it('successfully registers a new user and returns a token', async () => {
      const response = await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      expect(response.email).toBe('test@example.com');
      expect(response.username).toBe('testuser');
      expect(response.token).toBeDefined();

      const decoded = verify(response.token, JWT_SECRET) as { id: string; username: string };
      expect(decoded.username).toBe('testuser');
    });

    it('rejects registration with missing or blank fields', async () => {
      await expect(
        authService.register({ email: '', username: '', password: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects registration when email already exists', async () => {
      await authService.register({
        email: 'duplicate@example.com',
        username: 'firstuser',
        password: 'password123'
      });

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          username: 'seconduser',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects registration when username already exists', async () => {
      await authService.register({
        email: 'first@example.com',
        username: 'samename',
        password: 'password123'
      });

      await expect(
        authService.register({
          email: 'second@example.com',
          username: 'samename',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'user@example.com',
        username: 'validuser',
        password: 'secretpassword'
      });
    });

    it('successfully logs in with valid credentials', async () => {
      const response = await authService.login({
        email: 'user@example.com',
        password: 'secretpassword'
      });

      expect(response.email).toBe('user@example.com');
      expect(response.username).toBe('validuser');
      expect(response.token).toBeDefined();
    });

    it('rejects login with incorrect password', async () => {
      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects login with non-existent email', async () => {
      await expect(
        authService.login({
          email: 'notfound@example.com',
          password: 'secretpassword'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects login with missing email or password', async () => {
      await expect(
        authService.login({ email: '', password: '' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCurrentUser', () => {
    it('returns the user if found', async () => {
      const created = await authService.register({
        email: 'current@example.com',
        username: 'currentuser',
        password: 'password123'
      });

      const decoded = verify(created.token, JWT_SECRET) as { id: string };
      const fetched = await authService.getCurrentUser(decoded.id);

      expect(fetched.email).toBe('current@example.com');
      expect(fetched.username).toBe('currentuser');
    });

    it('throws NotFoundError if user does not exist', async () => {
      await expect(authService.getCurrentUser('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('updates user bio and image', async () => {
      const created = await authService.register({
        email: 'update@example.com',
        username: 'updateuser',
        password: 'password123'
      });

      const decoded = verify(created.token, JWT_SECRET) as { id: string };
      const updated = await authService.updateUser(decoded.id, {
        bio: 'Updated bio',
        image: 'https://example.com/avatar.jpg'
      });

      expect(updated.bio).toBe('Updated bio');
      expect(updated.image).toBe('https://example.com/avatar.jpg');
    });

    it('updates user password securely', async () => {
      const created = await authService.register({
        email: 'pass@example.com',
        username: 'passuser',
        password: 'oldpassword'
      });

      const decoded = verify(created.token, JWT_SECRET) as { id: string };
      await authService.updateUser(decoded.id, {
        password: 'newpassword123'
      });

      const login = await authService.login({
        email: 'pass@example.com',
        password: 'newpassword123'
      });
      expect(login.email).toBe('pass@example.com');
    });
  });
});
