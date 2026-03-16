import { PrismaClient, User } from '@prisma/client';

export interface ProfileData {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export class ProfileRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username }
    });
  }

  async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    return follow !== null;
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.upsert({
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

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId
      }
    });
  }
}
