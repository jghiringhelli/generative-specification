import { ProfileService } from '../../src/services/ProfileService';
import { IProfileRepository, ProfileData } from '../../src/repositories/IProfileRepository';
import { UserEntity } from '../../src/types';
import { NotFoundError } from '../../src/errors/AppError';

class FakeProfileRepository implements IProfileRepository {
  private users: UserEntity[] = [
    {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: 'hash',
      bio: 'Alice bio',
      image: 'alice.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-2',
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: 'hash',
      bio: 'Bob bio',
      image: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private follows: { followerId: string; followingId: string }[] = [];

  async findProfile(username: string, currentUserId?: string): Promise<ProfileData | null> {
    const user = this.users.find((u) => u.username === username);
    if (!user) return null;
    const following = currentUserId
      ? this.follows.some((f) => f.followerId === currentUserId && f.followingId === user.id)
      : false;
    return { user, following };
  }

  async follow(followerId: string, followingUsername: string): Promise<ProfileData> {
    const user = this.users.find((u) => u.username === followingUsername);
    if (!user) throw new NotFoundError('User not found');
    if (!this.follows.some((f) => f.followerId === followerId && f.followingId === user.id)) {
      this.follows.push({ followerId, followingId: user.id });
    }
    return { user, following: true };
  }

  async unfollow(followerId: string, followingUsername: string): Promise<ProfileData> {
    const user = this.users.find((u) => u.username === followingUsername);
    if (!user) throw new NotFoundError('User not found');
    this.follows = this.follows.filter(
      (f) => !(f.followerId === followerId && f.followingId === user.id)
    );
    return { user, following: false };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.follows.some((f) => f.followerId === followerId && f.followingId === followingId);
  }
}

describe('ProfileService unit tests', () => {
  let profileRepo: FakeProfileRepository;
  let profileService: ProfileService;

  beforeEach(() => {
    profileRepo = new FakeProfileRepository();
    profileService = new ProfileService(profileRepo);
  });

  it('gets profile without current user (following: false)', async () => {
    const profile = await profileService.getProfile('alice');
    expect(profile.username).toBe('alice');
    expect(profile.bio).toBe('Alice bio');
    expect(profile.following).toBe(false);
  });

  it('throws NotFoundError when profile does not exist', async () => {
    await expect(profileService.getProfile('unknown')).rejects.toThrow(NotFoundError);
  });

  it('follows a user and updates following state to true', async () => {
    const followed = await profileService.followUser('user-1', 'bob');
    expect(followed.username).toBe('bob');
    expect(followed.following).toBe(true);

    const profile = await profileService.getProfile('bob', 'user-1');
    expect(profile.following).toBe(true);
  });

  it('unfollows a user and updates following state to false', async () => {
    await profileService.followUser('user-1', 'bob');
    const unfollowed = await profileService.unfollowUser('user-1', 'bob');
    expect(unfollowed.username).toBe('bob');
    expect(unfollowed.following).toBe(false);

    const profile = await profileService.getProfile('bob', 'user-1');
    expect(profile.following).toBe(false);
  });
});
