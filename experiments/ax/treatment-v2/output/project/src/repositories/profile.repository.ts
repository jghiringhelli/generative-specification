import { PrismaClient } from '@prisma/client';
import { IProfileRepository, Profile } from './IProfileRepository';

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get a user profile by username
   * If currentUserId provided, includes whether current user follows this profile
   */
  async getProfile(username: string, currentUserId?: number): Promise<Profile | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        bio: true,
        image: true,
        followedBy: currentUserId
          ? {
              where: {
                followerId: currentUserId,
              },
              select: {
                followerId: true,
              },
            }
          : false,
      },
    });

    if (!user) {
      return null;
    }

    const following = currentUserId
      ? Array.isArray(user.followedBy) && user.followedBy.length > 0
      : false;

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    };
  }

  /**
   * Follow a user
   * Creates UserFollow record. Idempotent - no error if already following.
   */
  async follow(currentUserId: number, targetUsername: string): Promise<Profile> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Upsert to make it idempotent
    await this.prisma.userFollow.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
      create: {
        followerId: currentUserId,
        followingId: targetUser.id,
      },
      update: {}, // No-op if already exists
    });

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true,
    };
  }

  /**
   * Unfollow a user
   * Deletes UserFollow record. Idempotent - no error if not following.
   */
  async unfollow(currentUserId: number, targetUsername: string): Promise<Profile> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // deleteMany won't error if record doesn't exist (idempotent)
    await this.prisma.userFollow.deleteMany({
      where: {
        followerId: currentUserId,
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
