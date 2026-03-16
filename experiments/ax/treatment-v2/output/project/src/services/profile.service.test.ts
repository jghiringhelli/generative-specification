import { ProfileService } from './profile.service';
import { IProfileRepository, Profile } from '../repositories/IProfileRepository';
import { NotFoundError } from '../errors/NotFoundError';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;

  const mockProfile: Profile = {
    username: 'jake',
    bio: 'I work at statefarm',
    image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
    following: false,
  };

  beforeEach(() => {
    mockProfileRepository = {
      getProfile: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
    };

    profileService = new ProfileService(mockProfileRepository);
  });

  describe('getProfile', () => {
    it('getProfile_with_existing_username_returns_profile', async () => {
      mockProfileRepository.getProfile.mockResolvedValue(mockProfile);

      const result = await profileService.getProfile('jake');

      expect(result.profile).toEqual(mockProfile);
      expect(mockProfileRepository.getProfile).toHaveBeenCalledWith('jake', undefined);
    });

    it('getProfile_with_authenticated_user_passes_userId', async () => {
      const profileWithFollowing = { ...mockProfile, following: true };
      mockProfileRepository.getProfile.mockResolvedValue(profileWithFollowing);

      const result = await profileService.getProfile('jake', 1);

      expect(result.profile.following).toBe(true);
      expect(mockProfileRepository.getProfile).toHaveBeenCalledWith('jake', 1);
    });

    it('getProfile_with_nonexistent_username_throws_NotFoundError', async () => {
      mockProfileRepository.getProfile.mockResolvedValue(null);

      await expect(profileService.getProfile('nobody')).rejects.toThrow(NotFoundError);
      await expect(profileService.getProfile('nobody')).rejects.toThrow('Profile not found');
    });
  });

  describe('followUser', () => {
    it('followUser_with_valid_username_returns_profile_with_following_true', async () => {
      const followedProfile = { ...mockProfile, following: true };
      mockProfileRepository.follow.mockResolvedValue(followedProfile);

      const result = await profileService.followUser(1, 'jake');

      expect(result.profile.following).toBe(true);
      expect(mockProfileRepository.follow).toHaveBeenCalledWith(1, 'jake');
    });

    it('followUser_with_nonexistent_user_throws_NotFoundError', async () => {
      mockProfileRepository.follow.mockRejectedValue(new Error('Target user not found'));

      await expect(profileService.followUser(1, 'nobody')).rejects.toThrow(NotFoundError);
      await expect(profileService.followUser(1, 'nobody')).rejects.toThrow('Profile not found');
    });

    it('followUser_when_already_following_is_idempotent', async () => {
      const followedProfile = { ...mockProfile, following: true };
      mockProfileRepository.follow.mockResolvedValue(followedProfile);

      const result = await profileService.followUser(1, 'jake');

      expect(result.profile.following).toBe(true);
    });
  });

  describe('unfollowUser', () => {
    it('unfollowUser_with_valid_username_returns_profile_with_following_false', async () => {
      mockProfileRepository.unfollow.mockResolvedValue(mockProfile);

      const result = await profileService.unfollowUser(1, 'jake');

      expect(result.profile.following).toBe(false);
      expect(mockProfileRepository.unfollow).toHaveBeenCalledWith(1, 'jake');
    });

    it('unfollowUser_with_nonexistent_user_throws_NotFoundError', async () => {
      mockProfileRepository.unfollow.mockRejectedValue(new Error('Target user not found'));

      await expect(profileService.unfollowUser(1, 'nobody')).rejects.toThrow(NotFoundError);
      await expect(profileService.unfollowUser(1, 'nobody')).rejects.toThrow('Profile not found');
    });

    it('unfollowUser_when_not_following_is_idempotent', async () => {
      mockProfileRepository.unfollow.mockResolvedValue(mockProfile);

      const result = await profileService.unfollowUser(1, 'jake');

      expect(result.profile.following).toBe(false);
    });
  });
});
