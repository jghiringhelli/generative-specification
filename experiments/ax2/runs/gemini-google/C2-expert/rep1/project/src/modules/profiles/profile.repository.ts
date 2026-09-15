import { User } from '@prisma/client';
import { prisma } from '../../db/prisma';

export interface IProfileRepository {
  findByUsername(username: string): Promise<User | null>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  follow(followerId: string, followingId: string): Promise<void>;
  unfollow(followerId: string, followingId: string): Promise<void>;
}

export class ProfileRepository implements IProfileRepository {
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username }
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const record = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    return record !== null;
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    await prisma.follow.upsert({
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

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId
      }
    });
  }
}
