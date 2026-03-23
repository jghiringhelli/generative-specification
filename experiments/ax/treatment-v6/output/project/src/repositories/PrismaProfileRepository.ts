import type { PrismaClient } from '@prisma/client';
import type {
  IProfileRepository,
  Profile,
} from './IProfileRepository.js';
import { NotFoundError } from '../errors/AppError.js';

/**
 * Prisma-backed implementation of IProfileRepository.
 * §9 check: implements findByUsername, follow, unfollow, isFollowing.
 */
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findByUsername(username: string, currentUserId?: number): Promise<Profile | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        followedBy: currentUserId
          ? { where: { followerId: currentUserId } }
          : false,
      },
    });

    if (!user) return null;

    const following =
      currentUserId !== undefined
        ? (user as typeof user & { followedBy: { followerId: number }[] }).followedBy.length > 0
        : false;

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    };
  }

  /** @inheritdoc */
  async follow(followerId: number, followingUsername: string): Promise<Profile> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: followingUsername },
    });
    if (!targetUser) {
      throw new NotFoundError('User', followingUsername);
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
      create: { followerId, followingId: targetUser.id },
      update: {},
    });

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true,
    };
  }

  /** @inheritdoc */
  async unfollow(followerId: number, followingUsername: string): Promise<Profile> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: followingUsername },
    });
    if (!targetUser) {
      throw new NotFoundError('User', followingUsername);
    }

    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: targetUser.id },
    });

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false,
    };
  }

  /** @inheritdoc */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return follow !== null;
  }
}
