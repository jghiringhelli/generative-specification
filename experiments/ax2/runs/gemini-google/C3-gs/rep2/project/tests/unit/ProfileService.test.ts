import { ProfileService } from '../../src/services/ProfileService';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../../src/repositories/in-memory/InMemoryProfileRepository';
import { NotFoundError } from '../../src/errors/AppError';

describe('ProfileService Unit Tests', () => {
  let userRepository: InMemoryUserRepository;
  let profileRepository: InMemoryProfileRepository;
  let profileService: ProfileService;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    profileRepository = new InMemoryProfileRepository(userRepository);
    profileService = new ProfileService(profileRepository);

    await userRepository.create({
      username: 'targetuser',
      email: 'target@example.com',
      passwordHash: 'hashed123',
      bio: 'Target bio',
      image: 'https://avatar.com/target.png',
    });
  });

  describe('getProfile', () => {
    it('should return profile for existing username', async () => {
      const profile = await profileService.getProfile('targetuser');

      expect(profile.username).toBe('targetuser');
      expect(profile.bio).toBe('Target bio');
      expect(profile.image).toBe('https://avatar.com/target.png');
      expect(profile.following).toBe(false);
    });

    it('should throw NotFoundError for non-existent username', async () => {
      await expect(profileService.getProfile('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('followUser and unfollowUser', () => {
    it('should follow user and reflect following status', async () => {
      const follower = await userRepository.create({
        username: 'follower',
        email: 'follower@example.com',
        passwordHash: 'hashed123',
      });

      const followed = await profileService.followUser(follower.id, 'targetuser');
      expect(followed.following).toBe(true);

      const profileAfterFollow = await profileService.getProfile('targetuser', follower.id);
      expect(profileAfterFollow.following).toBe(true);

      const unfollowed = await profileService.unfollowUser(follower.id, 'targetuser');
      expect(unfollowed.following).toBe(false);

      const profileAfterUnfollow = await profileService.getProfile('targetuser', follower.id);
      expect(profileAfterUnfollow.following).toBe(false);
    });
  });
});
