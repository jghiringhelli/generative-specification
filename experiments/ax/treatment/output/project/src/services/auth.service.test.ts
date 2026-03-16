import { AuthService } from './auth.service';
import { IUserRepository } from '../repositories/user.repository';
import { User } from '@prisma/client';
import { ValidationError, AuthenticationError, NotFoundError } from '../errors';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2b$12$hashed_password',
    bio: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };

    authService = new AuthService(mockUserRepository);
  });

  describe('register', () => {
    it('creates_user_with_valid_data_returns_user_response_with_token', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'password123'
      });

      expect(result.email).toBe(mockUser.email);
      expect(result.username).toBe(mockUser.username);
      expect(result.token).toBeDefined();
      expect(result.bio).toBeNull();
      expect(result.image).toBeNull();
    });

    it('register_with_duplicate_email_throws_validation_error', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: mockUser.email,
          username: 'differentuser',
          password: 'password123'
        })
      ).rejects.toThrow('Email is already taken');
    });

    it('register_with_duplicate_username_throws_validation_error', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'different@example.com',
          username: mockUser.username,
          password: 'password123'
        })
      ).rejects.toThrow('Username is already taken');
    });
  });

  describe('login', () => {
    it('login_with_valid_credentials_returns_user_response_with_token', async () => {
      const hashedPassword = await require('bcrypt').hash('password123', 12);
      const userWithValidPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findByEmail.mockResolvedValue(userWithValidPassword);

      const result = await authService.login({
        email: mockUser.email,
        password: 'password123'
      });

      expect(result.email).toBe(mockUser.email);
      expect(result.token).toBeDefined();
    });

    it('login_with_invalid_email_throws_authentication_error', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('login_with_invalid_password_throws_authentication_error', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: mockUser.email,
          password: 'wrongpassword'
        })
      ).rejects.toThrow('Email or password');
    });
  });

  describe('getUserById', () => {
    it('get_existing_user_returns_user_response', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.getUserById(mockUser.id);

      expect(result.email).toBe(mockUser.email);
      expect(result.username).toBe(mockUser.username);
    });

    it('get_nonexistent_user_throws_not_found_error', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(authService.getUserById(999)).rejects.toThrow('User');
    });
  });

  describe('updateUser', () => {
    it('update_user_with_valid_data_returns_updated_user', async () => {
      const updatedUser = { ...mockUser, bio: 'New bio' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUser(mockUser.id, { bio: 'New bio' });

      expect(result.bio).toBe('New bio');
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ bio: 'New bio' })
      );
    });

    it('update_user_with_new_email_validates_uniqueness', async () => {
      const otherUser = { ...mockUser, id: 2, email: 'other@example.com' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByEmail.mockResolvedValue(otherUser);

      await expect(
        authService.updateUser(mockUser.id, { email: 'other@example.com' })
      ).rejects.toThrow(ValidationError);
    });

    it('update_user_with_same_email_skips_uniqueness_check', async () => {
      const updatedUser = { ...mockUser, bio: 'New bio' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      await authService.updateUser(mockUser.id, { email: mockUser.email, bio: 'New bio' });

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('update_user_with_same_username_skips_uniqueness_check', async () => {
      const updatedUser = { ...mockUser, bio: 'New bio' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      await authService.updateUser(mockUser.id, { username: mockUser.username, bio: 'New bio' });

      expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    });

    it('update_user_with_new_username_validates_uniqueness', async () => {
      const otherUser = { ...mockUser, id: 2, username: 'otheruser' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByUsername.mockResolvedValue(otherUser);

      await expect(
        authService.updateUser(mockUser.id, { username: 'otheruser' })
      ).rejects.toThrow('Username is already taken');
    });

    it('update_user_with_password_hashes_password_before_save', async () => {
      const updatedUser = { ...mockUser, passwordHash: 'newhash' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      await authService.updateUser(mockUser.id, { password: 'newpassword123' });

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ passwordHash: expect.any(String) })
      );
      // Ensure the plain-text password is not stored
      const updateCall = (mockUserRepository.update as jest.Mock).mock.calls[0][1];
      expect(updateCall.password).toBeUndefined();
    });

    it('update_nonexistent_user_throws_not_found_error', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        authService.updateUser(999, { bio: 'New bio' })
      ).rejects.toThrow('User');
    });
  });

  describe('token operations', () => {
    it('generate_and_verify_token_returns_correct_user_id', () => {
      const token = authService.generateToken(mockUser.id);
      const userId = authService.verifyToken(token);

      expect(userId).toBe(mockUser.id);
    });

    it('verify_invalid_token_throws_authentication_error', () => {
      expect(() => authService.verifyToken('invalid.token.here')).toThrow(
        'Invalid or expired token'
      );
    });
  });
});
