import { AuthService } from '../../src/services/AuthService';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../src/errors/AppError';

describe('AuthService Unit Tests', () => {
  let userRepository: InMemoryUserRepository;
  let authService: AuthService;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    authService = new AuthService(userRepository, 'test-secret', '1h');
  });

  describe('register', () => {
    it('should successfully register a new user and return a token', async () => {
      const result = await authService.register({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(result.username).toBe('alice');
      expect(result.email).toBe('alice@example.com');
      expect(result.bio).toBeNull();
      expect(result.image).toBeNull();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(10);
    });

    it('should throw ConflictError if email is already taken', async () => {
      await authService.register({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      });

      await expect(
        authService.register({
          username: 'bob',
          email: 'alice@example.com',
          password: 'anotherpassword',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if username is already taken', async () => {
      await authService.register({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      });

      await expect(
        authService.register({
          username: 'alice',
          email: 'different@example.com',
          password: 'anotherpassword',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        username: 'john',
        email: 'john@example.com',
        password: 'secretPassword1',
      });
    });

    it('should log in successfully with valid credentials', async () => {
      const result = await authService.login({
        email: 'john@example.com',
        password: 'secretPassword1',
      });

      expect(result.email).toBe('john@example.com');
      expect(result.username).toBe('john');
      expect(typeof result.token).toBe('string');
    });

    it('should throw UnauthorizedError when email is not found', async () => {
      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'secretPassword1',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when password does not match', async () => {
      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'wrongPassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data for a valid user id', async () => {
      const registered = await authService.register({
        username: 'carol',
        email: 'carol@example.com',
        password: 'password123',
      });

      const user = await userRepository.findByEmail('carol@example.com');
      const current = await authService.getCurrentUser(user!.id);

      expect(current.email).toBe('carol@example.com');
      expect(current.username).toBe('carol');
    });

    it('should throw NotFoundError for non-existent user id', async () => {
      await expect(authService.getCurrentUser('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('should update user bio, image, and username', async () => {
      await authService.register({
        username: 'dave',
        email: 'dave@example.com',
        password: 'password123',
      });
      const user = await userRepository.findByEmail('dave@example.com');

      const updated = await authService.updateUser(user!.id, {
        bio: 'Software engineer',
        image: 'https://avatar.com/dave.png',
        username: 'dave_new',
      });

      expect(updated.username).toBe('dave_new');
      expect(updated.bio).toBe('Software engineer');
      expect(updated.image).toBe('https://avatar.com/dave.png');
    });

    it('should throw ConflictError if updated email is already taken by another user', async () => {
      await authService.register({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
      });
      await authService.register({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
      });

      const user2 = await userRepository.findByEmail('user2@example.com');

      await expect(
        authService.updateUser(user2!.id, {
          email: 'user1@example.com',
        })
      ).rejects.toThrow(ConflictError);
    });
  });
});
