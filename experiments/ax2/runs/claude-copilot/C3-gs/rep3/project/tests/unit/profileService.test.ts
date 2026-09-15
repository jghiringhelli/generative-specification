import { ProfileService } from '../../src/services/ProfileService';
import {
  InMemoryProfileRepository,
  InMemoryUserRepository,
} from '../fixtures/inMemoryRepositories';
import { NotFoundError } from '../../src/errors/AppError';

async function seedUser(
  users: InMemoryUserRepository,
  username: string,
): Promise<number> {
  const user = await users.create({
    username,
    email: `${username}@example.com`,
    passwordHash: 'hash',
  });
  return user.id;
}

describe('ProfileService', () => {
  it('reports following=false for anonymous viewers', async () => {
    const users = new InMemoryUserRepository();
    const follows = new InMemoryProfileRepository();
    const service = new ProfileService(users, follows);
    await seedUser(users, 'star');

    const result = await service.getProfile('star', null);
    expect(result.profile.following).toBe(false);
  });

  it('throws NotFoundError for an unknown profile', async () => {
    const service = new ProfileService(
      new InMemoryUserRepository(),
      new InMemoryProfileRepository(),
    );
    await expect(service.getProfile('ghost', null)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('follows and reflects following=true', async () => {
    const users = new InMemoryUserRepository();
    const follows = new InMemoryProfileRepository();
    const service = new ProfileService(users, follows);
    const followerId = await seedUser(users, 'follower');
    await seedUser(users, 'target');

    const result = await service.follow('target', followerId);
    expect(result.profile.following).toBe(true);
  });

  it('unfollows and reflects following=false', async () => {
    const users = new InMemoryUserRepository();
    const follows = new InMemoryProfileRepository();
    const service = new ProfileService(users, follows);
    const followerId = await seedUser(users, 'f');
    await seedUser(users, 't');
    await service.follow('t', followerId);

    const result = await service.unfollow('t', followerId);
    expect(result.profile.following).toBe(false);
  });
});
