import { PrismaClient } from '@prisma/client';
import { IProfileRepository, Profile } from './IProfileRepository';

/**
 * Prisma implementation of IProfileRepository.
 * Single responsibility: translate Profile domain operations to Prisma ORM calls.
 */
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUsername(username: string, currentUserId?: number): Promise<Profile | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        bio: true,
        image: true,
        id: true
      }
    });

    if (!user) {
      return null;
    }

    let following = false;
    if (currentUserId) {
      following = await this.isFollowing(currentUserId, user.id);
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    };
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.userFollow.create({
      data: {
        followerId,
        followingId
      }
    });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
  }

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
}
