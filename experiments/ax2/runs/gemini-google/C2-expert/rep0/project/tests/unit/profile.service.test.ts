import { ProfileService } from '../../src/services/profile.service';
import { IProfileRepository } from '../../src/repositories/profile.repository';
import { NotFoundError } from '../../src/utils/error.util';

describe('ProfileService (unit)', () => {
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let profileService: ProfileService;

  beforeEach(() => {
    mockProfileRepository = {
      findProfileByUsername: jest.fn(),
      followUser: jest.fn(),
      unfollowUser: jest.fn()
    };
    profileService = new ProfileService(mockProfileRepository);
  });

  describe('getProfile', () => {
    it('returns profile data when user exists', async () => {
      mockProfileRepository.findProfileByUsername.mockResolvedValue({
        username: 'alice',
        bio: 'Developer',
        image: 'https://example.com/alice.jpg',
        following: false
      });

      const result = await profileService.getProfile('alice');

      expect(result.profile.username).toBe('alice');
      expect(result.profile.following).toBe(false);
    });

    it('throws NotFoundError when profile is not found', async () => {
      mockProfileRepository.findProfileByUsername.mockResolvedValue(null);

      await expect(profileService.getProfile('ghost')).rejects.toThrow(NotFoundError);
    });
  });

  describe('followUser', () => {
    it('returns profile with following true on successful follow', async () => {
      mockProfileRepository.followUser.mockResolvedValue({
        username: 'alice',
        bio: 'Developer',
        image: null,
        following: true
      });

      const result = await profileService.followUser(1, 'alice');

      expect(result.profile.following).toBe(true);
    });

    it('throws NotFoundError when following a user that does not exist', async () => {
      mockProfileRepository.followUser.mockResolvedValue(null);

      await expect(profileService.followUser(1, 'ghost')).rejects.toThrow(NotFoundError);
    });
  });

  describe('unfollowUser', () => {
    it('returns profile with following false on successful unfollow', async () => {
      mockProfileRepository.unfollowUser.mockResolvedValue({
        username: 'alice',
        bio: 'Developer',
        image: null,
        following: false
      });

      const result = await profileService.unfollowUser(1, 'alice');

      expect(result.profile.following).toBe(false);
    });

    it('throws NotFoundError when unfollowing a user that does not exist', async () => {
      mockProfileRepository.unfollowUser.mockResolvedValue(null);

      await expect(profileService.unfollowUser(1, 'ghost')).rejects.toThrow(NotFoundError);
    });
  });
});
