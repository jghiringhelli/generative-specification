import { ProfileService } from './ProfileService';
import { IProfileRepository, Profile } from '../repositories/IProfileRepository';
import { IUserRepository, User } from '../repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

/**
 * Mock implementation of IProfileRepository for unit tests.
 */
class MockProfileRepository implements IProfileRepository {
  private follows: Map<string, boolean> = new Map();

  async findByUsername(username: string, currentUserId?: number): Promise<Profile | null> {
    // This will be handled by MockUserRepository
    return null;
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    const key = `${followerId}-${followingId}`;
    this.follows.set(key, true);
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    const key = `${followerId}-${followingId}`;
    this.follows.delete(key);
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const key = `${followerId}-${followingId}`;
    return this.follows.get(key) || false;
  }

  reset(): void {
    this.follows.clear();
  }
}

/**
 * Mock implementation of IUserRepository for profile tests.
 */
class MockUserRepository implements IUserRepository {
  private users: User[] = [];
  private nextId = 1;

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async findById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async create(data: { email: string; username: string; passwordHash: string }): Promise<User> {
    const user: User = {
      id: this.nextId++,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    Object.assign(user, data, { updatedAt: new Date() });
    return user;
  }

  reset(): void {
    this.users = [];
    this.nextId = 1;
  }

  // Helper for tests
  addUser(username: string, bio: string | null = null, image: string | null = null): User {
    const user: User = {
      id: this.nextId++,
      email: `${username}@example.com`,
      username,
      passwordHash: 'hash',
      bio,
      image,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }
}

describe('ProfileService', () => {
  let profileRepository: MockProfileRepository;
  let userRepository: MockUserRepository;
  let service: ProfileService;

  beforeEach(() => {
    profileRepository = new MockProfileRepository();
    userRepository = new MockUserRepository();
    service = new ProfileService(profileRepository, userRepository);
  });

  describe('getProfile', () => {
    it('get_existing_profile_returns_profile_with_following_false', async () => {
      const targetUser = userRepository.addUser('jake', 'I work at statefarm', 'https://example.com/jake.jpg');

      const profile = await service.getProfile('jake');

      expect(profile.username).toBe('jake');
      expect(profile.bio).toBe('I work at statefarm');
      expect(profile.image).toBe('https://example.com/jake.jpg');
      expect(profile.following).toBe(false);
    });

    it('get_profile_when_following_returns_following_true', async () => {
      const currentUser = userRepository.addUser('alice');
      const targetUser = userRepository.addUser('bob');

      await profileRepository.follow(currentUser.id, targetUser.id);

      const profile = await service.getProfile('bob', currentUser.id);

      expect(profile.username).toBe('bob');
      expect(profile.following).toBe(true);
    });

    it('get_nonexistent_profile_throws_not_found_error', async () => {
      await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('followUser', () => {
    it('follow_existing_user_returns_profile_with_following_true', async () => {
      const currentUser = userRepository.addUser('alice');
      const targetUser = userRepository.addUser('bob', 'Bob bio');

      const profile = await service.followUser(currentUser.id, 'bob');

      expect(profile.username).toBe('bob');
      expect(profile.bio).toBe('Bob bio');
      expect(profile.following).toBe(true);

      const isFollowing = await profileRepository.isFollowing(currentUser.id, targetUser.id);
      expect(isFollowing).toBe(true);
    });

    it('follow_nonexistent_user_throws_not_found_error', async () => {
      const currentUser = userRepository.addUser('alice');

      await expect(
        service.followUser(currentUser.id, 'nonexistent')
      ).rejects.toThrow(NotFoundError);
    });

    it('follow_self_throws_validation_error', async () => {
      const currentUser = userRepository.addUser('alice');

      await expect(
        service.followUser(currentUser.id, 'alice')
      ).rejects.toThrow(ValidationError);
    });

    it('follow_already_followed_user_throws_validation_error', async () => {
      const currentUser = userRepository.addUser('alice');
      const targetUser = userRepository.addUser('bob');

      await profileRepository.follow(currentUser.id, targetUser.id);

      await expect(
        service.followUser(currentUser.id, 'bob')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('unfollowUser', () => {
    it('unfollow_followed_user_returns_profile_with_following_false', async () => {
      const currentUser = userRepository.addUser('alice');
      const targetUser = userRepository.addUser('bob', 'Bob bio');

      await profileRepository.follow(currentUser.id, targetUser.id);

      const profile = await service.unfollowUser(currentUser.id, 'bob');

      expect(profile.username).toBe('bob');
      expect(profile.bio).toBe('Bob bio');
      expect(profile.following).toBe(false);

      const isFollowing = await profileRepository.isFollowing(currentUser.id, targetUser.id);
      expect(isFollowing).toBe(false);
    });

    it('unfollow_nonexistent_user_throws_not_found_error', async () => {
      const currentUser = userRepository.addUser('alice');

      await expect(
        service.unfollowUser(currentUser.id, 'nonexistent')
      ).rejects.toThrow(NotFoundError);
    });

    it('unfollow_not_followed_user_throws_validation_error', async () => {
      const currentUser = userRepository.addUser('alice');
      userRepository.addUser('bob');

      await expect(
        service.unfollowUser(currentUser.id, 'bob')
      ).rejects.toThrow(ValidationError);
    });
  });
});
