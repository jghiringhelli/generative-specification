import { IProfileRepository } from '../../src/repositories/IProfileRepository';

/**
 * In-memory fake implementation of {@link IProfileRepository} for tests.
 */
export class InMemoryProfileRepository implements IProfileRepository {
  private readonly follows = new Set<string>();

  /**
   * Build the composite key for a follow pair.
   * @param followerId - Follower id.
   * @param followedId - Followed id.
   * @returns The key string.
   */
  private key(followerId: number, followedId: number): string {
    return `${followerId}:${followedId}`;
  }

  /** @inheritdoc */
  async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    return this.follows.has(this.key(followerId, followedId));
  }

  /** @inheritdoc */
  async follow(followerId: number, followedId: number): Promise<void> {
    this.follows.add(this.key(followerId, followedId));
  }

  /** @inheritdoc */
  async unfollow(followerId: number, followedId: number): Promise<void> {
    this.follows.delete(this.key(followerId, followedId));
  }

  /** @inheritdoc */
  async findFollowedIds(followerId: number): Promise<number[]> {
    const ids: number[] = [];
    for (const entry of this.follows) {
      const [follower, followed] = entry.split(':').map(Number);
      if (follower === followerId) {
        ids.push(followed);
      }
    }
    return ids;
  }
}
