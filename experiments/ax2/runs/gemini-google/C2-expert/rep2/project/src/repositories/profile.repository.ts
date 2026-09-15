import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

export class ProfileRepository {
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username }
    });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const followRecord = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    return !!followRecord;
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    await prisma.follows.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      },
      update: {},
      create: {
        followerId,
        followingId
      }
    });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await prisma.follows.deleteMany({
      where: {
        followerId,
        followingId
      }
    });
  }
}

export const profileRepository = new ProfileRepository();
