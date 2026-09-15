import { ProfileService } from '../../src/services/ProfileService';
import { InMemoryUserRepository } from '../helpers/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../helpers/InMemoryProfileRepository';
import { NotFoundError } from '../../src/errors/AppError';

/**
 * Build a ProfileService with in-memory dependencies and a seeded target user.
 */
async function buildService(): Promise<{
  service: ProfileService;
  users: InMemoryUserRepository;
  targetId: number;
}> {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const target = await users.create({
    email: 'celeb@example.com',
    username: 'celeb',
    passwordHash: 'x'
  });
  return { service: new ProfileService(users, profiles), users, targetId: target.id };
}

describe('ProfileService', () => {
  it('returns following=false for an anonymous viewer', async () => {
    const { service } = await buildService();
    const result = await service.getProfile('celeb', undefined);
    expect(result.profile.following).toBe(false);
  });

  it('throws NotFoundError for an unknown username', async () => {
    const { service } = await buildService();
    await expect(service.getProfile('ghost', undefined)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('follow then getProfile reflects following=true', async () => {
    const { service, users } = await buildService();
    const fan = await users.create({
      email: 'fan@example.com',
      username: 'fan',
      passwordHash: 'x'
    });
    await service.follow('celeb', fan.id);
    const result = await service.getProfile('celeb', fan.id);
    expect(result.profile.following).toBe(true);
  });

  it('unfollow clears the relationship', async () => {
    const { service, users } = await buildService();
    const fan = await users.create({
      email: 'fan@example.com',
      username: 'fan',
      passwordHash: 'x'
    });
    await service.follow('celeb', fan.id);
    const result = await service.unfollow('celeb', fan.id);
    expect(result.profile.following).toBe(false);
  });
});
