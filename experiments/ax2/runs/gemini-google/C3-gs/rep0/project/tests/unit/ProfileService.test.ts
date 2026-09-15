// tests/unit/ProfileService.test.ts
import { ProfileService } from '../../src/services/ProfileService';
import { IProfileRepository } from '../../src/repositories/IProfileRepository';
import { NotFoundError } from '../../src/errors/AppError';

describe('ProfileService Unit Tests', () => {
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let profileService: ProfileService;

  beforeEach(() => {
    mockProfileRepository = {
      findByUsername: jest.fn(),
      followUser: jest.fn(),
      unfollowUser: jest.fn(),
      isFollowing: jest.fn()
    };
    profileService = new ProfileService(mockProfileRepository);
  });

  describe('getProfile', () => {
    it('should return profile successfully when user exists', async () => {
      mockProfileRepository.findByUsername.mockResolvedValue({
        username: 'alice',
        bio: 'Writer',
        image: 'https://image.com/alice.jpg',
        following: false
      });

      const profile = await profileService.getProfile('alice', 'user1');
      expect(profile.username).toBe('alice');
      expect(profile.following).toBe(false);
      expect(mockProfileRepository.findByUsername).toHaveBeenCalledWith('alice', 'user1');
    });

    it('should throw NotFoundError when profile is not found', async () => {
      mockProfileRepository.findByUsername.mockResolvedValue(null);

      await expect(profileService.getProfile('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('follow', () => {
    it('should follow user and return updated profile', async () => {
      mockProfileRepository.followUser.mockResolvedValue({
        username: 'alice',
        bio: 'Writer',
        image: 'https://image.com/alice.jpg',
        following: true
      });

      const profile = await profileService.follow('user1', 'alice');
      expect(profile.username).toBe('alice');
      expect(profile.following).toBe(true);
      expect(mockProfileRepository.followUser).toHaveBeenCalledWith('user1', 'alice');
    });
  });

  describe('unfollow', () => {
    it('should unfollow user and return profile with following=false', async () => {
      mockProfileRepository.unfollowUser.mockResolvedValue({
        username: 'alice',
        bio: 'Writer',
        image: 'https://image.com/alice.jpg',
        following: false
      });

      const profile = await profileService.unfollow('user1', 'alice');
      expect(profile.username).toBe('alice');
      expect(profile.following).toBe(false);
      expect(mockProfileRepository.unfollowUser).toHaveBeenCalledWith('user1', 'alice');
    });
  });
});
