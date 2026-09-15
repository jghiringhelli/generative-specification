import { NotFoundError } from '../../src/errors/app-error';
import { UserRepository } from '../../src/repositories/user.repository';
import { ProfileService } from '../../src/services/profile.service';

describe('ProfileService Unit Tests', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let profileService: ProfileService;

  beforeEach(() => {
    mockUserRepo = {
      findByUsername: jest.fn(),
      isFollowing: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    profileService = new ProfileService(mockUserRepo);
  });

  it('returns profile with following false when viewer is unauthenticated', async () => {
    mockUserRepo.findByUsername.mockResolvedValue({
      id: 2,
      username: 'targetuser',
      email: 'target@example.com',
      password: 'hash',
      bio: 'Author bio',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await profileService.getProfile('targetuser');

    expect(result.username).toBe('targetuser');
    expect(result.bio).toBe('Author bio');
    expect(result.following).toBe(false);
  });

  it('returns profile with following true when follower relationship exists', async () => {
    mockUserRepo.findByUsername.mockResolvedValue({
      id: 2,
      username: 'targetuser',
      email: 'target@example.com',
      password: 'hash',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockUserRepo.isFollowing.mockResolvedValue(true);

    const result = await profileService.getProfile('targetuser', 1);

    expect(result.following).toBe(true);
    expect(mockUserRepo.isFollowing).toHaveBeenCalledWith(1, 2);
  });

  it('throws NotFoundError when target profile username does not exist', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(null);

    await expect(profileService.getProfile('nonexistent')).rejects.toThrow(NotFoundError);
  });

  it('follows target user and returns profile with following true', async () => {
    mockUserRepo.findByUsername.mockResolvedValue({
      id: 3,
      username: 'influencer',
      email: 'inf@example.com',
      password: 'hash',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockUserRepo.follow.mockResolvedValue(undefined);

    const result = await profileService.followUser(1, 'influencer');

    expect(result.following).toBe(true);
    expect(mockUserRepo.follow).toHaveBeenCalledWith(1, 3);
  });

  it('unfollows target user and returns profile with following false', async () => {
    mockUserRepo.findByUsername.mockResolvedValue({
      id: 3,
      username: 'influencer',
      email: 'inf@example.com',
      password: 'hash',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockUserRepo.unfollow.mockResolvedValue(undefined);

    const result = await profileService.unfollowUser(1, 'influencer');

    expect(result.following).toBe(false);
    expect(mockUserRepo.unfollow).toHaveBeenCalledWith(1, 3);
  });
});
