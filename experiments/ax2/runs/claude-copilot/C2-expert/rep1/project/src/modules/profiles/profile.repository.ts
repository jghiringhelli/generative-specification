import { PrismaClient, User } from '@prisma/client';

/**
 * Persistence adapter for profile/following relationships.
 * The only place `prisma.follow` (and profile user lookups) is touched.
 */
export class ProfileRepository {
  /** @param prisma injected Prisma client */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Finds a user by username.
   * @param username the username to look up
   * @returns the user or null
   */
  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /**
   * Determines whether one user follows another.
   * @param followerId the potential follower id
   * @param followingId the potential followee id
   * @returns true when a follow relationship exists
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });
    return follow !== null;
  }

  /**
   * Returns the ids of every user the given user follows.
   * @param followerId the follower id
   * @returns list of followed user ids
   */
  async getFollowingIds(followerId: number): Promise<number[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId },
      select: { followingId: true }
    });
    return rows.map((row) => row.followingId);
  }

  /**
   * Creates a follow relationship idempotently.
   * @param followerId the follower id
   * @param followingId the followee id
   */
  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {}
    });
  }

  /**
   * Removes a follow relationship idempotently.
   * @param followerId the follower id
   * @param followingId the followee id
   */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }
}
