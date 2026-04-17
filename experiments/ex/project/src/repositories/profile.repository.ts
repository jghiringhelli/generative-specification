import { PrismaClient } from '@prisma/client';

/**
 * Profile repository interface.
 * Handles follow/unfollow operations.
 */
export interface IProfileRepository {
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  follow(followerId: number, followingId: number): Promise<void>;
  unfollow(followerId: number, followingId: number): Promise<void>;
  getFollowerCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
}

/**
 * Prisma implementation of profile repository.
 */
export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    return follow !== null;
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.userFollow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      },
      create: {
        followerId,
        followingId
      },
      update: {}
    });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.userFollow.deleteMany({
      where: {
        followerId,
        followingId
      }
    });
  }

  async getFollowerCount(userId: number): Promise<number> {
    return this.prisma.userFollow.count({
      where: { followingId: userId }
    });
  }

  async getFollowingCount(userId: number): Promise<number> {
    return this.prisma.userFollow.count({
      where: { followerId: userId }
    });
  }
}
