// tests/unit/ProfileService.test.ts
import { ProfileService } from '../../src/services/ProfileService';
import { IProfileRepository, ProfileRecord } from '../../src/repositories/IProfileRepository';
import { NotFoundError } from '../../src/errors/AppError';

class MockProfileRepository implements IProfileRepository {
  private profiles: Map<string, { username: string; bio: string | null; image: string | null }> = new Map();
  private followingMap: Map<string, Set<string>> = new Map(); // followerId -> set of usernames

  public addProfile(username: string, bio: string | null = null, image: string | null = null): void {
    this.profiles.set(username, { username, bio, image });
  }

  public async isFollowing(followerId: string, targetUserId: string): Promise<boolean> {
    return this.followingMap.get(followerId)?.has(targetUserId) ?? false;
  }

  public async findByUsername(username: string, currentUserId?: string): Promise<ProfileRecord | null> {
    const profile = this.profiles.get(username);
    if (!profile) return null;

    const following = currentUserId ? (this.followingMap.get(currentUserId)?.has(username) ?? false) : false;

    return {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following
    };
  }

  public async follow(followerId: string, username: string): Promise<ProfileRecord> {
    const profile = this.profiles.get(username);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    if (!this.followingMap.has(followerId)) {
      this.followingMap.set(followerId, new Set());
    }
    this.followingMap.get(followerId)!.add(username);

    return {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following: true
    };
  }

  public async unfollow(followerId: string, username: string): Promise<ProfileRecord> {
    const profile = this.profiles.get(username);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    if (this.followingMap.has(followerId)) {
      this.followingMap.get(followerId)!.delete(username);
    }

    return {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following: false
    };
  }
}

describe('ProfileService', () => {
  let profileRepository: MockProfileRepository;
  let profileService: ProfileService;

  beforeEach(() => {
    profileRepository = new MockProfileRepository();
    profileRepository.addProfile('johndoe', 'Software engineer', 'https://example.com/john.jpg');
    profileService = new ProfileService(profileRepository);
  });

  describe('getProfile', () => {
    it('returns profile without following when unauthenticated', async () => {
      const profile = await profileService.getProfile('johndoe');
      expect(profile.username).toBe('johndoe');
      expect(profile.bio).toBe('Software engineer');
      expect(profile.image).toBe('https://example.com/john.jpg');
      expect(profile.following).toBe(false);
    });

    it('returns following true when current user follows target', async () => {
      await profileService.follow('user1', 'johndoe');
      const profile = await profileService.getProfile('johndoe', 'user1');
      expect(profile.following).toBe(true);
    });

    it('throws NotFoundError when profile does not exist', async () => {
      await expect(profileService.getProfile('ghost')).rejects.toThrow(NotFoundError);
    });
  });

  describe('follow', () => {
    it('successfully follows a user', async () => {
      const profile = await profileService.follow('user1', 'johndoe');
      expect(profile.following).toBe(true);
      expect(profile.username).toBe('johndoe');
    });

    it('throws NotFoundError when following a nonexistent user', async () => {
      await expect(profileService.follow('user1', 'ghost')).rejects.toThrow(NotFoundError);
    });
  });

  describe('unfollow', () => {
    it('successfully unfollows a user', async () => {
      await profileService.follow('user1', 'johndoe');
      const profile = await profileService.unfollow('user1', 'johndoe');
      expect(profile.following).toBe(false);
      expect(profile.username).toBe('johndoe');
    });

    it('throws NotFoundError when unfollowing a nonexistent user', async () => {
      await expect(profileService.unfollow('user1', 'ghost')).rejects.toThrow(NotFoundError);
    });
  });
});
