
/**
 * Unit tests for ProfileService.
 * Tests business logic with mock repository.
 */

import { ProfileService } from './profile.service';
import type { IProfileRepository, IProfile } from '../repositories/IProfileRepository';
import { NotFoundError, ConflictError } from '../errors/AppError';

// Mock repository
const mockProfileRepository: jest.Mocked<IProfileRepository> = {
  getByUsername: jest.fn(),
  follow: jest.fn(),
  unfollow: jest.fn()
};

describe('ProfileService', () => {
  let profileService: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    profileService = new ProfileService(mockProfileRepository);
  });

  describe('getProfile', () => {
    it('returns profile when user exists and is not authenticated', async () => {
      const profile: IProfile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/avatar.jpg',
        following: false
      };

      mockProfileRepository.getByUsername.mockResolvedValue(profile);

      const result = await profileService.getProfile('testuser', null);

      expect(mockProfileRepository.getByUsername).toHaveBeenCalledWith('testuser', null);
      expect(result).toEqual(profile);
    });

    it('returns profile with following status when authenticated', async () => {
      const profile: IProfile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/avatar.jpg',
        following: true
      };

      mockProfileRepository.getByUsername.mockResolvedValue(profile);

      const result = await profileService.getProfile('testuser', 1);

      expect(mockProfileRepository.getByUsername).toHaveBeenCalledWith('testuser', 1);
      expect(result.following).toBe(true);
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockProfileRepository.getByUsername.mockResolvedValue(null);

      await expect(profileService.getProfile('nonexistent', null)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('followUser', () => {
    it('follows user and returns profile with following true', async () => {
      const profile: IProfile = {
        username: 'targetuser',
        bio: 'Target bio',
        image: 'https://example.com/target.jpg',
        following: true
      };

      mockProfileRepository.follow.mockResolvedValue(profile);

      const result = await profileService.followUser(1, 'targetuser');

      expect(mockProfileRepository.follow).toHaveBeenCalledWith(1, 'targetuser');
      expect(result.following).toBe(true);
      expect(result.username).toBe('targetuser');
    });

    it('throws NotFoundError when target user does not exist', async () => {
      mockProfileRepository.follow.mockRejectedValue(new NotFoundError('User', 'nonexistent'));

      await expect(profileService.followUser(1, 'nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when already following', async () => {
      mockProfileRepository.follow.mockRejectedValue(
        new ConflictError('Already following this user')
      );

      await expect(profileService.followUser(1, 'targetuser')).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when attempting to follow self', async () => {
      mockProfileRepository.follow.mockRejectedValue(new ConflictError('Cannot follow yourself'));

      await expect(profileService.followUser(1, 'selfusername')).rejects.toThrow(ConflictError);
    });
  });

  describe('unfollowUser', () => {
    it('unfollows user and returns profile with following false', async () => {
      const profile: IProfile = {
        username: 'targetuser',
        bio: 'Target bio',
        image: 'https://example.com/target.jpg',
        following: false
      };

      mockProfileRepository.unfollow.mockResolvedValue(profile);

      const result = await profileService.unfollowUser(1, 'targetuser');

      expect(mockProfileRepository.unfollow).toHaveBeenCalledWith(1, 'targetuser');
      expect(result.following).toBe(false);
      expect(result.username).toBe('targetuser');
    });

    it('throws NotFoundError when target user does not exist', async () => {
      mockProfileRepository.unfollow.mockRejectedValue(
        new NotFoundError('User', 'nonexistent')
      );

      await expect(profileService.unfollowUser(1, 'nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when not currently following', async () => {
      mockProfileRepository.unfollow.mockRejectedValue(
        new NotFoundError('Follow relationship')
      );

      await expect(profileService.unfollowUser(1, 'targetuser')).rejects.toThrow(NotFoundError);
    });
  });
});
