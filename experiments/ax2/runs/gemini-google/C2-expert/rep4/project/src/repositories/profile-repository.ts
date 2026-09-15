import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../prisma';
import {
  IProfileRepository,
  ProfileUserData,
} from './profile-repository.interface';

/**
 * Prisma implementation of profile operations and follow tracking.
 */
export class ProfileRepository implements IProfileRepository {
  private readonly db: PrismaClient;

  /**
   * Constructs the ProfileRepository.
   *
   * @param {PrismaClient} [dbClient=defaultPrisma] - Prisma database client
   */
  constructor(dbClient: PrismaClient = defaultPrisma) {
    this.db = dbClient;
  }

  /**
   * Retrieves profile user info by username.
   *
   * @param {string} username - Target username
   * @returns {Promise<ProfileUserData | null>} Matching user data or null
   */
  public async findByUsername(username: string): Promise<ProfileUserData | null> {
    const user = await this.db.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
      },
    });

    return user;
  }

  /**
   * Checks if a follow connection exists.
   *
   * @param {string} followerId - Follower user ID
   * @param {string} followingId - Target user ID
   * @returns {Promise<boolean>} True if following, false otherwise
   */
  public async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const record = await this.db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return record !== null;
  }

  /**
   * Adds follow connection idempotently.
   *
   * @param {string} followerId - Follower user ID
   * @param {string} followingId - Target user ID
   * @returns {Promise<void>}
   */
  public async follow(followerId: string, followingId: string): Promise<void> {
    await this.db.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      create: {
        followerId,
        followingId,
      },
      update: {},
    });
  }

  /**
   * Removes follow connection idempotently.
   *
   * @param {string} followerId - Follower user ID
   * @param {string} followingId - Target user ID
   * @returns {Promise<void>}
   */
  public async unfollow(followerId: string, followingId: string): Promise<void> {
    try {
      await this.db.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    } catch {
      // Idempotent: ignore if not found
    }
  }
}
