import { ProfileService } from '../../src/services/ProfileService';
import {
  InMemoryProfileRepository,
  InMemoryStore,
  InMemoryUserRepository,
} from '../helpers/inMemory';
import { NotFoundError } from '../../src/errors/AppError';

async function seed() {
  const store = new InMemoryStore();
  const users = new InMemoryUserRepository(store);
  const viewer = await users.create({ email: 'v@e.com', username: 'viewer', passwordHash: 'h' });
  const target = await users.create({ email: 't@e.com', username: 'target', passwordHash: 'h' });
  return { service: new ProfileService(new InMemoryProfileRepository(store)), viewer, target };
}

describe('ProfileService', () => {
  it('returns a profile with following=false by default', async () => {
    const { service, viewer } = await seed();
    const profile = await service.getProfile('target', viewer.id);
    expect(profile.username).toBe('target');
    expect(profile.following).toBe(false);
  });

  it('throws NotFoundError for an unknown username', async () => {
    const { service } = await seed();
    await expect(service.getProfile('ghost', null)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('follows and reflects following=true', async () => {
    const { service, viewer } = await seed();
    const followed = await service.follow('target', viewer.id);
    expect(followed.following).toBe(true);
    const profile = await service.getProfile('target', viewer.id);
    expect(profile.following).toBe(true);
  });

  it('unfollows and reflects following=false', async () => {
    const { service, viewer } = await seed();
    await service.follow('target', viewer.id);
    const unfollowed = await service.unfollow('target', viewer.id);
    expect(unfollowed.following).toBe(false);
  });
});
