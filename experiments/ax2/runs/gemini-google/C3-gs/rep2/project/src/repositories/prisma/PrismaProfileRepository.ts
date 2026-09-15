import { PrismaClient } from '@prisma/client';
import { IProfileRepository, ProfileEntity } from '../IProfileRepository';
import { NotFoundError } from '../../errors/AppError';

export class PrismaProfileRepository implements IProfileRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Retrieves profile data for a specific username and calculates following status.
   */
  async getProfile(username: string, currentUserId?: string): Promise<ProfileEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: currentUserId
        ? {
            followedBy: {
              where: { followerId: currentUserId },
            },
          }
        : undefined,
    });

    if (!user) {
      return null;
    }

    const following = currentUserId ? (user as unknown as { followedBy?: unknown[] }).followedBy?.length! > 0 : false;

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    };
  }

  /**
   * Establishes a follow relationship between followerId and target username.
   */
  async follow(followerId: string, usernameToFollow: string): Promise<ProfileEntity> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: usernameToFollow },
    });

    if (!targetUser) {
      throw new NotFoundError('Profile not found');
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
      update: {},
      create: {
        followerId,
        followingId: targetUser.id,
      },
    });

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true,
    };
  }

  /**
   * Removes a follow relationship between followerId and target username.
   */
  async unfollow(followerId: string, usernameToUnfollow: string): Promise<ProfileEntity> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: usernameToUnfollow },
    });

    if (!targetUser) {
      throw new NotFoundError('Profile not found');
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId: targetUser.id,
      },
    });

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false,
    };
  }
}
