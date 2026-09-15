import { ProfileService } from '../../src/services/ProfileService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../fakes/InMemoryProfileRepository';
import { NotFoundError } from '../../src/errors/AppError';

/**
 * Build a ProfileService and seed two users.
 * @returns The service and the two seeded user ids.
 */
async function setup(): Promise<{
  service: ProfileService;
  aliceId: number;
  bobId: number;
}> {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const alice = await users.create({
    email: 'alice@example.com',
    username: 'alice',
    passwordHash: 'h',
  });
  const bob = await users.create({ email: 'bob@example.com', username: 'bob', passwordHash: 'h' });
  return { service: new ProfileService(users, profiles), aliceId: alice.id, bobId: bob.id };
}

describe('ProfileService', () => {
  it('returns a profile with following=false for an anonymous viewer', async () => {
    const { service } = await setup();
    const profile = await service.getProfile('bob');
    expect(profile.username).toBe('bob');
    expect(profile.following).toBe(false);
  });

  it('throws NotFoundError for an unknown username', async () => {
    const { service } = await setup();
    await expect(service.getProfile('ghost')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('follows a user and reflects following=true', async () => {
    const { service, aliceId } = await setup();
    const profile = await service.follow('bob', aliceId);
    expect(profile.following).toBe(true);

    const viewed = await service.getProfile('bob', aliceId);
    expect(viewed.following).toBe(true);
  });

  it('unfollows a user and reflects following=false', async () => {
    const { service, aliceId } = await setup();
    await service.follow('bob', aliceId);
    const profile = await service.unfollow('bob', aliceId);
    expect(profile.following).toBe(false);
  });

  it('never reports following oneself', async () => {
    const { service, aliceId } = await setup();
    const profile = await service.getProfile('alice', aliceId);
    expect(profile.following).toBe(false);
  });
});
