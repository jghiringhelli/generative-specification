// tests/unit/AuthService.test.ts
import { AuthService } from '../../src/services/AuthService';
import { IUserRepository } from '../../src/repositories/IUserRepository';
import { ValidationError, NotFoundError } from '../../src/errors/AppError';
import * as argon2 from 'argon2';

describe('AuthService Unit Tests', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let authService: AuthService;

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      existsByEmailOrUsername: jest.fn()
    };
    authService = new AuthService(mockUserRepository);
    process.env.JWT_SECRET = 'unit-test-secret';
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockUserRepository.existsByEmailOrUsername.mockResolvedValue({
        emailExists: false,
        usernameExists: false
      });
      mockUserRepository.create.mockResolvedValue({
        id: 'u1',
        email: 'john@example.com',
        username: 'john',
        password: 'hashedpassword',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await authService.register({
        email: 'john@example.com',
        username: 'john',
        password: 'secretpassword'
      });

      expect(result.email).toBe('john@example.com');
      expect(result.username).toBe('john');
      expect(result.token).toBeDefined();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError if email or password missing', async () => {
      await expect(
        authService.register({
          email: '',
          username: 'john',
          password: ''
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if email or username is already taken', async () => {
      mockUserRepository.existsByEmailOrUsername.mockResolvedValue({
        emailExists: true,
        usernameExists: true
      });

      await expect(
        authService.register({
          email: 'taken@example.com',
          username: 'taken',
          password: 'secretpassword'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('should successfully log in with valid credentials', async () => {
      const hashedPassword = await argon2.hash('secretpassword');
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'john@example.com',
        username: 'john',
        password: hashedPassword,
        bio: 'Developer',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await authService.login({
        email: 'john@example.com',
        password: 'secretpassword'
      });

      expect(result.email).toBe('john@example.com');
      expect(result.token).toBeDefined();
      expect(result.bio).toBe('Developer');
    });

    it('should throw ValidationError on non-existent user or invalid password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user with provided token', async () => {
      mockUserRepository.findById.mockResolvedValue({
        id: 'u1',
        email: 'john@example.com',
        username: 'john',
        password: 'hashedpassword',
        bio: 'Hello world',
        image: 'https://avatar.png',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await authService.getCurrentUser('u1', 'valid-token-123');
      expect(result.username).toBe('john');
      expect(result.token).toBe('valid-token-123');
    });

    it('should throw NotFoundError if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        authService.getCurrentUser('nonexistent', 'token')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('should update user fields and return updated profile', async () => {
      mockUserRepository.findById.mockResolvedValue({
        id: 'u1',
        email: 'john@example.com',
        username: 'john',
        password: 'hashedpassword',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockUserRepository.update.mockResolvedValue({
        id: 'u1',
        email: 'john@example.com',
        username: 'john',
        password: 'hashedpassword',
        bio: 'New bio',
        image: 'https://new-image.png',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await authService.updateUser(
        'u1',
        { bio: 'New bio', image: 'https://new-image.png' },
        'existing-token'
      );

      expect(result.bio).toBe('New bio');
      expect(result.image).toBe('https://new-image.png');
    });
  });
});
