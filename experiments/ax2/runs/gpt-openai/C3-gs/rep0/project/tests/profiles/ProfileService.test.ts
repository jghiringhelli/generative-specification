import { ProfileService } from '../../src/profiles/ProfileService';
import { IProfileRepository } from '../../src/repositories/IProfileRepository';

test('rejects following your own profile', async () => {
  const profiles: jest.Mocked<IProfileRepository> = {
    findByUsername: jest.fn().mockResolvedValue({
      id: 'user-id', email: 'alice@example.com', username: 'alice',
      passwordHash: 'hash', bio: null, image: null,
    }),
    isFollowing: jest.fn(), follow: jest.fn(), unfollow: jest.fn(),
  };
  await expect(new ProfileService(profiles).follow('alice', 'user-id'))
    .rejects.toMatchObject({ statusCode: 403 });
});
