import { AuthService } from './auth.service';
import { IUserRepository, UserEntity } from '../repositories/IUserRepository';
import { ValidationError, AuthenticationError } from '../errors/AppError';
import argon2 from 'argon2';

// Mock repository
class MockUserRepository implements IUserRepository {
  private users: UserEntity[] = [];
  private nextId = 1;

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async create(data: any): Promise<UserEntity> {
    const user: UserEntity = {
      id: this.nextId++,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: data.bio || null,
      image: data.image || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async update(id: number, data: any): Promise<UserEntity> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    
    Object.assign(user, {
      ...data,
      updatedAt: new Date()
    });
    return user;
  }

  async isFollowing(): Promise<boolean> {
    return false;
  }

  async follow(): Promise<void> {}
  async unfollow(): Promise<void> {}
}

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    authService = new AuthService(mockRepository);
  });

  describe('register', () => {
    it('creates_user_with_valid_data_returns_user_with_token', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.token).toBeDefined();
      expect(result.bio).toBeNull();
      expect(result.image).toBeNull();
    });

    it('hashes_password_with_argon2', async () => {
      await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const user = await mockRepository.findByEmail('test@example.com');
      expect(user).not.toBeNull();
      
      const isValid = await argon2.verify(user!.passwordHash, 'password123');
      expect(isValid).toBe(true);
    });

    it('register_with_duplicate_email_throws_ValidationError', async () => {
      await authService.register({
        email: 'test@example.com',
        username: 'user1',
        password: 'password123'
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          username: 'user2',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('register_with_duplicate_username_throws_ValidationError', async () => {
      await authService.register({
        email: 'user1@example.com',
        username: 'testuser',
        password: 'password123'
      });

      await expect(
        authService.register({
          email: 'user2@example.com',
          username: 'testuser',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
    });

    it('login_with_valid_credentials_returns_user_with_token', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.token).toBeDefined();
    });

    it('login_with_invalid_email_throws_ValidationError', async () => {
      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('login_with_invalid_password_throws_ValidationError', async () => {
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCurrentUser', () => {
    it('get_existing_user_returns_user_with_fresh_token', async () => {
      const registered = await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const user = await mockRepository.findByEmail('test@example.com');
      const result = await authService.getCurrentUser(user!.id);

      expect(result.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(result.token).not.toBe(registered.token); // Fresh token
    });

    it('get_nonexistent_user_throws_AuthenticationError', async () => {
      await expect(
        authService.getCurrentUser(999)
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('updateUser', () => {
    let userId: number;

    beforeEach(async () => {
      const user = await mockRepository.create({
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: await argon2.hash('password123')
      });
      userId = user.id;
    });

    it('update_email_returns_user_with_new_email', async () => {
      const result = await authService.updateUser(userId, {
        email: 'newemail@example.com'
      });

      expect(result.email).toBe('newemail@example.com');
    });

    it('update_bio_and_image_returns_user_with_new_values', async () => {
      const result = await authService.updateUser(userId, {
        bio: 'New bio',
        image: 'https://example.com/image.jpg'
      });

      expect(result.bio).toBe('New bio');
      expect(result.image).toBe('https://example.com/image.jpg');
    });

    it('update_with_duplicate_email_throws_ValidationError', async () => {
      await mockRepository.create({
        email: 'other@example.com',
        username: 'otheruser',
        passwordHash: await argon2.hash('password123')
      });

      await expect(
        authService.updateUser(userId, {
          email: 'other@example.com'
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
