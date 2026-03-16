
/**
 * Unit tests for AuthService.
 * Tests business logic with mock repository.
 */

import { AuthService } from './auth.service';
import type { IUserRepository, IUser } from '../repositories/IUserRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';
import * as argon2 from 'argon2';

// Mock repository
const mockUserRepository: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getProfile: jest.fn(),
  follow: jest.fn(),
  unfollow: jest.fn(),
  isFollowing: jest.fn()
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(mockUserRepository);
  });

  describe('register', () => {
    it('creates user with hashed password and returns token', async () => {
      const input = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      const createdUser: IUser = {
        id: 1,
        email: input.email,
        username: input.username,
        passwordHash: 'hashed',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await authService.register(input);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(input.username);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: input.email,
        username: input.username,
        passwordHash: expect.any(String)
      });

      expect(result.email).toBe(input.email);
      expect(result.username).toBe(input.username);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('throws ValidationError when email already exists', async () => {
      const existingUser: IUser = {
        id: 1,
        email: 'test@example.com',
        username: 'other',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          username: 'newuser',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('throws ValidationError when username already exists', async () => {
      const existingUser: IUser = {
        id: 1,
        email: 'other@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(existingUser);

      await expect(
        authService.register({
          email: 'new@example.com',
          username: 'testuser',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns user and token when credentials are valid', async () => {
      const password = 'password123';
      const passwordHash = await argon2.hash(password);

      const user: IUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash,
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);

      const result = await authService.login({
        email: 'test@example.com',
        password
      });

      expect(result.email).toBe(user.email);
      expect(result.username).toBe(user.username);
      expect(result.bio).toBe(user.bio);
      expect(result.image).toBe(user.image);
      expect(result.token).toBeDefined();
    });

    it('throws ValidationError when email does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when password is incorrect', async () => {
      const passwordHash = await argon2.hash('correctpassword');

      const user: IUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash,
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCurrentUser', () => {
    it('returns user with token when user exists', async () => {
      const user: IUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue(user);

      const result = await authService.getCurrentUser(1);

      expect(result.email).toBe(user.email);
      expect(result.username).toBe(user.username);
      expect(result.token).toBeDefined();
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(authService.getCurrentUser(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('updates user fields and returns updated user', async () => {
      const updatedUser: IUser = {
        id: 1,
        email: 'newemail@example.com',
        username: 'newusername',
        passwordHash: 'hash',
        bio: 'Updated bio',
        image: 'https://example.com/new.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUser(1, {
        email: 'newemail@example.com',
        username: 'newusername',
        bio: 'Updated bio',
        image: 'https://example.com/new.jpg'
      });

      expect(result.email).toBe(updatedUser.email);
      expect(result.username).toBe(updatedUser.username);
      expect(result.bio).toBe(updatedUser.bio);
    });

    it('throws ValidationError when new email conflicts with another user', async () => {
      const existingUser: IUser = {
        id: 2,
        email: 'taken@example.com',
        username: 'other',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authService.updateUser(1, { email: 'taken@example.com' })
      ).rejects.toThrow(ValidationError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('hashes password when password is provided', async () => {
      const updatedUser: IUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'newhash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      await authService.updateUser(1, { password: 'newpassword123' });

      expect(mockUserRepository.update).toHaveBeenCalledWith(1, {
        email: undefined,
        username: undefined,
        bio: undefined,
        image: undefined,
        passwordHash: expect.any(String)
      });
    });
  });
});
