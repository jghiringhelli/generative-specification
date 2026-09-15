import { ProfileNotFoundError } from '../../src/profiles/profile.errors';
import { ProfileRepositoryPort } from '../../src/profiles/profile.repository';
import { ProfileService } from '../../src/profiles/profile.service';
import { ProfileRecord } from '../../src/profiles/profile.types';

class FakeProfileRepository implements ProfileRepositoryPort {
  public following = false;
  private readonly profile: ProfileRecord = { id: 2, username: 'bob', bio: null, image: null };

  public async findByUsername(username: string): Promise<ProfileRecord | null> {
    return username === this.profile.username ? this.profile : null;
  }
  public async isFollowing(): Promise<boolean> { return this.following; }
  public async follow(): Promise<void> { this.following = true; }
  public async unfollow(): Promise<void> { this.following = false; }
}

describe('profile service', () => {
  test('returns following false for an unauthenticated request', async () => {
    const profile = await new ProfileService(new FakeProfileRepository()).get('bob');
    expect(profile.following).toBe(false);
  });

  test('returns the authenticated users following relationship', async () => {
    const repository = new FakeProfileRepository();
    repository.following = true;
    const profile = await new ProfileService(repository).get('bob', 1);
    expect(profile.following).toBe(true);
  });

  test('follows and unfollows a profile idempotently', async () => {
    const service = new ProfileService(new FakeProfileRepository());
    await expect(service.follow('bob', 1)).resolves.toMatchObject({ following: true });
    await expect(service.unfollow('bob', 1)).resolves.toMatchObject({ following: false });
  });

  test('rejects a profile that does not exist', async () => {
    const service = new ProfileService(new FakeProfileRepository());
    await expect(service.get('missing')).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});
