import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/**
 * Data-access layer for follow relationships and profile lookups.
 */
export class ProfileRepository {
  /**
   * Finds a user by username.
   * @param username the username to search for
   * @returns the matching user or null
   */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  /**
   * Determines whether one user follows another.
   * @param followerId the potential follower's id
   * @param followingId the potential followee's id
   * @returns true when the follow relationship exists
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return follow !== null;
  }

  /**
   * Creates a follow relationship idempotently.
   * @param followerId the follower's id
   * @param followingId the followee's id
   */
  async follow(followerId: number, followingId: number): Promise<void> {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  /**
   * Removes a follow relationship idempotently.
   * @param followerId the follower's id
   * @param followingId the followee's id
   */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
  }
}
