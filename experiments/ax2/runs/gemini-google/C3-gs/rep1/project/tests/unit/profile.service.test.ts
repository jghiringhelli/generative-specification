import { ProfileService } from '../../src/services/ProfileService';
import {
  IProfileRepository,
  ProfileEntity,
} from '../../src/repositories/IProfileRepository';
import { NotFoundError } from '../../src/errors/AppError';

class FakeProfileRepository implements IProfileRepository {
  private profiles: ProfileEntity[] = [];
  private follows: Set<string> = new Set(); // key: followerId:followingId

  addProfile(profile: ProfileEntity) {
    this.profiles.push(profile);
  }

  async findByUsername(username: string): Promise<ProfileEntity | null> {
    return (
      this.profiles.find(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      ) ?? null
    );
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    this.follows.add(`${followerId}:${followingId}`);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    this.follows.delete(`${followerId}:${followingId}`);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.follows.has(`${followerId}:${followingId}`);
  }
}

describe('ProfileService', () => {
  let fakeRepo: FakeProfileRepository;
  let service: ProfileService;

  beforeEach(() => {
    fakeRepo = new FakeProfileRepository();
    service = new ProfileService(fakeRepo);

    fakeRepo.addProfile({
      id: 'user-1',
      username: 'jake',
      bio: 'Jake bio',
      image: 'https://example.com/jake.png',
    });
    fakeRepo.addProfile({
      id: 'user-2',
      username: 'john',
      bio: 'John bio',
      image: '',
    });
  });

  describe('getProfile', () => {
    it('returns profile with following false when not logged in', async () => {
      const profile = await service.getProfile('jake');

      expect(profile.username).toBe('jake');
      expect(profile.bio).toBe('Jake bio');
      expect(profile.following).toBe(false);
    });

    it('returns following true if current user follows profile', async () => {
      await fakeRepo.follow('user-2', 'user-1');

      const profile = await service.getProfile('jake', 'user-2');
      expect(profile.following).toBe(true);
    });

    it('throws NotFoundError for non-existent profile', async () => {
      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('followUser', () => {
    it('follows user and returns profile with following true', async () => {
      const profile = await service.followUser('jake', 'user-2');

      expect(profile.username).toBe('jake');
      expect(profile.following).toBe(true);
      expect(await fakeRepo.isFollowing('user-2', 'user-1')).toBe(true);
    });

    it('throws NotFoundError when target user does not exist', async () => {
      await expect(service.followUser('ghost', 'user-2')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('unfollowUser', () => {
    it('unfollows user and returns profile with following false', async () => {
      await fakeRepo.follow('user-2', 'user-1');

      const profile = await service.unfollowUser('jake', 'user-2');

      expect(profile.username).toBe('jake');
      expect(profile.following).toBe(false);
      expect(await fakeRepo.isFollowing('user-2', 'user-1')).toBe(false);
    });
  });
});
