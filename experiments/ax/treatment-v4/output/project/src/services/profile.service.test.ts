import { ProfileService } from './profile.service';
import { IProfileRepository, ProfileEntity } from '../repositories/IProfileRepository';
import { IUserRepository, UserEntity } from '../repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

// Mock repositories
class MockProfileRepository implements IProfileRepository {
  private profiles: Map<string, ProfileEntity> = new Map();

  setProfile(profile: ProfileEntity): void {
    this.profiles.set(profile.username, profile);
  }

  async getByUsername(username: string, currentUserId?: number): Promise<ProfileEntity | null> {
    const profile = this.profiles.get(username);
    if (!profile) return null;

    // In real implementation, following status would be queried from DB
    // For mock, we return what was set
    return profile;
  }
}

class MockUserRepository implements IUserRepository {
  private users: Map<number, UserEntity> = new Map();
  private usersByUsername: Map<string, UserEntity> = new Map();
  private follows: Set<string> = new Set();

  addUser(user: UserEntity): void {
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
  }

  async findByEmail(): Promise<UserEntity | null> {
    return null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.usersByUsername.get(username) || null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async create(): Promise<UserEntity> {
    throw new Error('Not implemented');
  }

  async update(): Promise<UserEntity> {
    throw new Error('Not implemented');
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.follows.has(`${followerId}-${followingId}`);
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    this.follows.add(`${followerId}-${followingId}`);
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    this.follows.delete(`${followerId}-${followingId}`);
  }
}

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockProfileRepo: MockProfileRepository;
  let mockUserRepo: MockUserRepository;

  beforeEach(() => {
    mockProfileRepo = new MockProfileRepository();
    mockUserRepo = new MockUserRepository();
    profileService = new ProfileService(mockProfileRepo, mockUserRepo);
  });

  describe('getProfile', () => {
    beforeEach(() => {
      mockProfileRepo.setProfile({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });

    it('get_existing_profile_without_auth_returns_profile_with_following_false', async () => {
      const profile = await profileService.getProfile('johndoe');

      expect(profile).toEqual({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });

    it('get_existing_profile_with_auth_returns_profile_with_follow_status', async () => {
      mockProfileRepo.setProfile({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: true
      });

      const profile = await profileService.getProfile('johndoe', 1);

      expect(profile.username).toBe('johndoe');
      expect(profile.following).toBe(true);
    });

    it('get_nonexistent_profile_throws_NotFoundError', async () => {
      await expect(
        profileService.getProfile('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('followUser', () => {
    beforeEach(() => {
      mockUserRepo.addUser({
        id: 1,
        email: 'current@example.com',
        username: 'currentuser',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepo.addUser({
        id: 2,
        email: 'target@example.com',
        username: 'targetuser',
        passwordHash: 'hash',
        bio: 'Target bio',
        image: 'https://example.com/target.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('follow_existing_user_returns_profile_with_following_true', async () => {
      const profile = await profileService.followUser('targetuser', 1);

      expect(profile).toEqual({
        username: 'targetuser',
        bio: 'Target bio',
        image: 'https://example.com/target.jpg',
        following: true
      });

      const isFollowing = await mockUserRepo.isFollowing(1, 2);
      expect(isFollowing).toBe(true);
    });

    it('follow_already_followed_user_is_idempotent', async () => {
      await profileService.followUser('targetuser', 1);
      const profile = await profileService.followUser('targetuser', 1);

      expect(profile.following).toBe(true);
    });

    it('follow_nonexistent_user_throws_NotFoundError', async () => {
      await expect(
        profileService.followUser('nonexistent', 1)
      ).rejects.toThrow(NotFoundError);
    });

    it('follow_self_throws_ValidationError', async () => {
      await expect(
        profileService.followUser('currentuser', 1)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('unfollowUser', () => {
    beforeEach(() => {
      mockUserRepo.addUser({
        id: 1,
        email: 'current@example.com',
        username: 'currentuser',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepo.addUser({
        id: 2,
        email: 'target@example.com',
        username: 'targetuser',
        passwordHash: 'hash',
        bio: 'Target bio',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('unfollow_followed_user_returns_profile_with_following_false', async () => {
      await mockUserRepo.follow(1, 2);

      const profile = await profileService.unfollowUser('targetuser', 1);

      expect(profile).toEqual({
        username: 'targetuser',
        bio: 'Target bio',
        image: null,
        following: false
      });

      const isFollowing = await mockUserRepo.isFollowing(1, 2);
      expect(isFollowing).toBe(false);
    });

    it('unfollow_not_followed_user_is_idempotent', async () => {
      const profile = await profileService.unfollowUser('targetuser', 1);

      expect(profile.following).toBe(false);
    });

    it('unfollow_nonexistent_user_throws_NotFoundError', async () => {
      await expect(
        profileService.unfollowUser('nonexistent', 1)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
