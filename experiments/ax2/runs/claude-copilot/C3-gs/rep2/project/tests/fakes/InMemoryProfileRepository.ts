import { IProfileRepository } from '../../src/repositories/IProfileRepository';

/**
 * In-memory fake implementing {@link IProfileRepository}.
 */
export class InMemoryProfileRepository implements IProfileRepository {
  private readonly edges = new Set<string>();

  /**
   * Build the composite key for a follow edge.
   * @param followerId - Follower id.
   * @param followingId - Followed id.
   * @returns The edge key.
   */
  private key(followerId: number, followingId: number): string {
    return `${followerId}:${followingId}`;
  }

  /** @inheritdoc */
  async follow(followerId: number, followingId: number): Promise<void> {
    this.edges.add(this.key(followerId, followingId));
  }

  /** @inheritdoc */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    this.edges.delete(this.key(followerId, followingId));
  }

  /** @inheritdoc */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.edges.has(this.key(followerId, followingId));
  }

  /**
   * List ids of users followed by a given follower (test helper).
   * @param followerId - Follower id.
   * @returns Followed user ids.
   */
  followingIds(followerId: number): number[] {
    const ids: number[] = [];
    for (const edge of this.edges) {
      const [follower, following] = edge.split(':').map(Number);
      if (follower === followerId) {
        ids.push(following);
      }
    }
    return ids;
  }
}
