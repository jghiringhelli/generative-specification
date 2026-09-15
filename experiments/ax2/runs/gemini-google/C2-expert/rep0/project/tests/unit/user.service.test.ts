import { UserService } from '../../src/services/user.service';
import { IUserRepository } from '../../src/repositories/user.repository';
import { ValidationError, NotFoundError } from '../../src/utils/error.util';
import * as passwordUtil from '../../src/utils/password.util';

describe('UserService (unit)', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let userService: UserService;

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      update: jest.fn()
    };
    userService = new UserService(mockUserRepository);
  });

  describe('register', () => {
    it('creates user and returns user payload with token on valid registration', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        username: 'john',
        password: 'hashed-password',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await userService.register({
        email: 'john@example.com',
        username: 'john',
        password: 'password123'
      });

      expect(result.user.email).toBe('john@example.com');
      expect(result.user.username).toBe('john');
      expect(result.user.token).toBeDefined();
    });

    it('throws ValidationError when email is already registered', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
        username: 'existing',
        password: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await expect(
        userService.register({
          email: 'existing@example.com',
          username: 'newuser',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when username is already taken', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 1,
        email: 'user1@example.com',
        username: 'takenusername',
        password: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await expect(
        userService.register({
          email: 'user2@example.com',
          username: 'takenusername',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('returns user payload with token on correct password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        username: 'john',
        password: 'hashed-password',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(true);

      const result = await userService.login({
        email: 'john@example.com',
        password: 'correctpassword'
      });

      expect(result.user.email).toBe('john@example.com');
      expect(result.user.token).toBeDefined();
    });

    it('throws ValidationError when email is not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        userService.login({
          email: 'notfound@example.com',
          password: 'password'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when password verification fails', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        username: 'john',
        password: 'hashed-password',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(false);

      await expect(
        userService.login({
          email: 'john@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCurrentUser', () => {
    it('returns user information when user exists', async () => {
      mockUserRepository.findById.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        username: 'john',
        password: 'hashed-password',
        bio: 'Hello world',
        image: 'https://img.com/avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await userService.getCurrentUser(1);

      expect(result.user.username).toBe('john');
      expect(result.user.bio).toBe('Hello world');
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getCurrentUser(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('throws ValidationError when new email belongs to another user', async () => {
      mockUserRepository.findById.mockResolvedValue({
        id: 1,
        email: 'user1@example.com',
        username: 'user1',
        password: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepository.findByEmail.mockResolvedValue({
        id: 2,
        email: 'user2@example.com',
        username: 'user2',
        password: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await expect(
        userService.updateUser(1, { email: 'user2@example.com' })
      ).rejects.toThrow(ValidationError);
    });
  });
});
