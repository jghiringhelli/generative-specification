import { prisma } from '../lib/prisma';

/**
 * Persistence adapter for follow relationships between users.
 */
export class FollowRepository {
  private readonly client = prisma;

  /**
   * Determines whether one user follows another.
   * @param followerId The id of the potential follower.
   * @param followingId The id of the user potentially being followed.
   * @returns `true` when the follow relationship exists.
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const existing = await this.client.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });
    return existing !== null;
  }

  /**
   * Creates a follow relationship idempotently.
   * @param followerId The follower's id.
   * @param followingId The followed user's id.
   */
  async follow(followerId: number, followingId: number): Promise<void> {
    await this.client.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {}
    });
  }

  /**
   * Removes a follow relationship idempotently.
   * @param followerId The follower's id.
   * @param followingId The followed user's id.
   */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.client.follow.deleteMany({
      where: { followerId, followingId }
    });
  }

  /**
   * Lists the ids of users followed by the given user.
   * @param followerId The follower's id.
   * @returns The ids of followed users.
   */
  async findFollowingIds(followerId: number): Promise<number[]> {
    const rows = await this.client.follow.findMany({
      where: { followerId },
      select: { followingId: true }
    });
    return rows.map((row) => row.followingId);
  }
}
