import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma.client';
import { ProfileData } from '../types/profile.types';

export interface IProfileRepository {
  findProfileByUsername(targetUsername: string, currentUserId?: number): Promise<ProfileData | null>;
  followUser(followerId: number, targetUsername: string): Promise<ProfileData | null>;
  unfollowUser(followerId: number, targetUsername: string): Promise<ProfileData | null>;
}

export class ProfileRepository implements IProfileRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  /**
   * Retrieves profile information for a user by username.
   * Computes the following status relative to currentUserId if provided.
   *
   * @param {string} targetUsername - Username of profile to fetch
   * @param {number} [currentUserId] - Optional viewer user ID
   * @returns {Promise<ProfileData | null>} Profile data or null if user does not exist
   */
  public async findProfileByUsername(
    targetUsername: string,
    currentUserId?: number
  ): Promise<ProfileData | null> {
    const user = await this.db.user.findUnique({
      where: { username: targetUsername },
      include: {
        followedBy: currentUserId
          ? {
              where: { followerId: currentUserId }
            }
          : false
      }
    });

    if (!user) {
      return null;
    }

    const following = Boolean(
      currentUserId && user.followedBy && user.followedBy.length > 0
    );

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    };
  }

  /**
   * Follows a target user by username idempotently.
   *
   * @param {number} followerId - ID of follower user
   * @param {string} targetUsername - Username of user to follow
   * @returns {Promise<ProfileData | null>} Updated profile data or null if target not found
   */
  public async followUser(
    followerId: number,
    targetUsername: string
  ): Promise<ProfileData | null> {
    const targetUser = await this.db.user.findUnique({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return null;
    }

    if (followerId !== targetUser.id) {
      await this.db.follows.upsert({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id
          }
        },
        create: {
          followerId,
          followingId: targetUser.id
        },
        update: {}
      });
    }

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true
    };
  }

  /**
   * Unfollows a target user by username idempotently.
   *
   * @param {number} followerId - ID of follower user
   * @param {string} targetUsername - Username of user to unfollow
   * @returns {Promise<ProfileData | null>} Updated profile data or null if target not found
   */
  public async unfollowUser(
    followerId: number,
    targetUsername: string
  ): Promise<ProfileData | null> {
    const targetUser = await this.db.user.findUnique({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return null;
    }

    await this.db.follows.deleteMany({
      where: {
        followerId,
        followingId: targetUser.id
      }
    });

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
