import {
  IProfileRepository,
  ProfileRecord,
} from '../../src/repositories/IProfileRepository';
import { IUserRepository } from '../../src/repositories/IUserRepository';

export class InMemoryProfileRepository implements IProfileRepository {
  private readonly follows = new Set<string>();

  public constructor(private readonly users: IUserRepository) {}

  public async findByUsername(username: string): Promise<ProfileRecord | null> {
    const user = await this.users.findByUsername(username);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  public async follow(followerId: string, followedId: string): Promise<void> {
    this.follows.add(this.key(followerId, followedId));
  }

  public async unfollow(followerId: string, followedId: string): Promise<void> {
    this.follows.delete(this.key(followerId, followedId));
  }

  public async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    return this.follows.has(this.key(followerId, followedId));
  }

  private key(followerId: string, followedId: string): string {
    return `${followerId}:${followedId}`;
  }
}
