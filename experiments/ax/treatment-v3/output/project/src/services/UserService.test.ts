import { UserService } from './UserService';
import { IUserRepository, User } from '../repositories/IUserRepository';
import { ValidationError, AuthenticationError, NotFoundError } from '../errors/AppError';
import argon2 from 'argon2';

/**
 * Mock implementation of IUserRepository for unit tests.
 */
class MockUserRepository implements IUserRepository {
  private users: User[] = [];
  private nextId = 1;

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async findById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
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
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    Object.assign(user, data, { updatedAt: new Date() });
    return user;
  }

  reset(): void {
    this.users = [];
    this.nextId = 1;
  }
}

describe('UserService', () => {
  let repository: MockUserRepository;
  let service: UserService;

  beforeEach(() => {
    repository = new MockUserRepository();
    service = new UserService(repository);
  });

  describe('register', () => {
    it('creates_user_with_valid_data_returns_user_with_token', async () => {
      const result = await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.bio).toBeNull();
      expect(result.image).toBeNull();
    });

    it('register_with_duplicate_email_throws_validation_error', async () => {
      await service.register({
        email: 'test@example.com',
        username: 'user1',
        password: 'password123'
      });

      await expect(
        service.register({
          email: 'test@example.com',
          username: 'user2',
          password: 'password456'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('register_with_duplicate_username_throws_validation_error', async () => {
      await service.register({
        email: 'user1@example.com',
        username: 'testuser',
        password: 'password123'
      });

      await expect(
        service.register({
          email: 'user2@example.com',
          username: 'testuser',
          password: 'password456'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('register_hashes_password_with_argon2', async () => {
      const password = 'password123';
      await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password
      });

      const user = await repository.findByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user!.passwordHash).not.toBe(password);
      
      // Verify hash is valid Argon2
      const isValid = await argon2.verify(user!.passwordHash, password);
      expect(isValid).toBe(true);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
    });

    it('login_with_correct_credentials_returns_user_with_token', async () => {
      const result = await service.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.token).toBeDefined();
    });

    it('login_with_wrong_email_throws_authentication_error', async () => {
      await expect(
        service.login({
          email: 'wrong@example.com',
          password: 'password123'
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('login_with_wrong_password_throws_authentication_error', async () => {
      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('getCurrentUser', () => {
    it('get_existing_user_returns_user_with_token', async () => {
      const registered = await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const user = await repository.findByEmail('test@example.com');
      const result = await service.getCurrentUser(user!.id);

      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.token).toBeDefined();
    });

    it('get_nonexistent_user_throws_not_found_error', async () => {
      await expect(service.getCurrentUser(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    let userId: number;

    beforeEach(async () => {
      await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
      const user = await repository.findByEmail('test@example.com');
      userId = user!.id;
    });

    it('update_email_returns_updated_user', async () => {
      const result = await service.updateUser(userId, {
        email: 'newemail@example.com'
      });

      expect(result.email).toBe('newemail@example.com');
      expect(result.username).toBe('testuser');
    });

    it('update_username_returns_updated_user', async () => {
      const result = await service.updateUser(userId, {
        username: 'newusername'
      });

      expect(result.username).toBe('newusername');
      expect(result.email).toBe('test@example.com');
    });

    it('update_bio_and_image_returns_updated_user', async () => {
      const result = await service.updateUser(userId, {
        bio: 'My bio',
        image: 'https://example.com/avatar.jpg'
      });

      expect(result.bio).toBe('My bio');
      expect(result.image).toBe('https://example.com/avatar.jpg');
    });

    it('update_password_hashes_new_password', async () => {
      await service.updateUser(userId, {
        password: 'newpassword123'
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'newpassword123'
      });

      expect(result.email).toBe('test@example.com');
    });

    it('update_with_duplicate_email_throws_validation_error', async () => {
      await service.register({
        email: 'other@example.com',
        username: 'otheruser',
        password: 'password123'
      });

      await expect(
        service.updateUser(userId, { email: 'other@example.com' })
      ).rejects.toThrow(ValidationError);
    });

    it('update_nonexistent_user_throws_not_found_error', async () => {
      await expect(
        service.updateUser(999, { bio: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
