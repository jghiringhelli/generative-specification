import {
  IProfileRepository,
  ProfileRecord,
} from '../../src/repositories/IProfileRepository';

export class InMemoryProfileRepository implements IProfileRepository {
  private readonly follows = new Set<string>();

  public constructor(
    private readonly profiles: ReadonlyArray<ProfileRecord>,
  ) {}

  public findByUsername(username: string): Promise<ProfileRecord | null> {
    return Promise.resolve(
      this.profiles.find((profile) => profile.username === username) ?? null,
    );
  }

  public isFollowing(followerId: string, followedId: string): Promise<boolean> {
    return Promise.resolve(this.follows.has(`${followerId}:${followedId}`));
  }

  public follow(followerId: string, followedId: string): Promise<void> {
    this.follows.add(`${followerId}:${followedId}`);
    return Promise.resolve();
  }

  public unfollow(followerId: string, followedId: string): Promise<void> {
    this.follows.delete(`${followerId}:${followedId}`);
    return Promise.resolve();
  }
}
