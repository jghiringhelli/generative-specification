import { ProfileService } from './profile.service';
import { IUserRepository } from '../repositories/user.repository';
import { IProfileRepository } from '../repositories/profile.repository';
import { User } from '@prisma/client';
import { NotFoundError } from '../errors';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;

  const mockUser: User = {
    id: 1,
    email: 'john@example.com',
    username: 'johndoe',
    passwordHash: '$2b$12$hashed',
    bio: 'I like coding',
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTargetUser: User = {
    id: 2,
    email: 'jane@example.com',
    username: 'janedoe',
    passwordHash: '$2b$12$hashed',
    bio: 'I like testing',
    image: 'https://example.com/jane.jpg',
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

    mockProfileRepository = {
      isFollowing: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
      getFollowerCount: jest.fn(),
      getFollowingCount: jest.fn()
    };

    profileService = new ProfileService(mockUserRepository, mockProfileRepository);
  });

  describe('getProfile', () => {
    it('get_existing_profile_without_auth_returns_profile_with_following_false', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await profileService.getProfile('johndoe');

      expect(result).toEqual({
        username: 'johndoe',
        bio: 'I like coding',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });

    it('get_existing_profile_with_auth_checks_following_status', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockTargetUser);
      mockProfileRepository.isFollowing.mockResolvedValue(true);

      const result = await profileService.getProfile('janedoe', mockUser.id);

      expect(result.following).toBe(true);
      expect(mockProfileRepository.isFollowing).toHaveBeenCalledWith(
        mockUser.id,
        mockTargetUser.id
      );
    });

    it('get_nonexistent_profile_throws_not_found_error', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(profileService.getProfile('nonexistent')).rejects.toThrow(
        'Profile'
      );
    });
  });

  describe('followUser', () => {
    it('follow_existing_user_creates_follow_relationship', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockTargetUser);
      mockProfileRepository.follow.mockResolvedValue();

      const result = await profileService.followUser(mockUser.id, 'janedoe');

      expect(result).toEqual({
        username: 'janedoe',
        bio: 'I like testing',
        image: 'https://example.com/jane.jpg',
        following: true
      });
      expect(mockProfileRepository.follow).toHaveBeenCalledWith(
        mockUser.id,
        mockTargetUser.id
      );
    });

    it('follow_nonexistent_user_throws_not_found_error', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(
        profileService.followUser(mockUser.id, 'nonexistent')
      ).rejects.toThrow('Profile');
    });

    it('follow_yourself_throws_not_found_error', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(
        profileService.followUser(mockUser.id, mockUser.username)
      ).rejects.toThrow('Profile');
    });

    it('follow_already_followed_user_is_idempotent', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockTargetUser);
      mockProfileRepository.follow.mockResolvedValue();

      const result = await profileService.followUser(mockUser.id, 'janedoe');

      expect(result.following).toBe(true);
      expect(mockProfileRepository.follow).toHaveBeenCalled();
    });
  });

  describe('unfollowUser', () => {
    it('unfollow_existing_user_removes_follow_relationship', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockTargetUser);
      mockProfileRepository.unfollow.mockResolvedValue();

      const result = await profileService.unfollowUser(mockUser.id, 'janedoe');

      expect(result).toEqual({
        username: 'janedoe',
        bio: 'I like testing',
        image: 'https://example.com/jane.jpg',
        following: false
      });
      expect(mockProfileRepository.unfollow).toHaveBeenCalledWith(
        mockUser.id,
        mockTargetUser.id
      );
    });

    it('unfollow_nonexistent_user_throws_not_found_error', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(
        profileService.unfollowUser(mockUser.id, 'nonexistent')
      ).rejects.toThrow('nonexistent');
    });

    it('unfollow_not_followed_user_is_idempotent', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockTargetUser);
      mockProfileRepository.unfollow.mockResolvedValue();

      const result = await profileService.unfollowUser(mockUser.id, 'janedoe');

      expect(result.following).toBe(false);
      expect(mockProfileRepository.unfollow).toHaveBeenCalled();
    });
  });
});
