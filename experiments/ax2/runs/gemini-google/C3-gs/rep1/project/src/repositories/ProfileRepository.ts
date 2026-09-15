import { PrismaClient } from '@prisma/client';
import { IProfileRepository, ProfileEntity } from './IProfileRepository';
import { prisma as defaultPrisma } from '../config/prisma';

export class ProfileRepository implements IProfileRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  async findByUsername(username: string): Promise<ProfileEntity | null> {
    const user = await this.db.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    await this.db.follows.upsert({
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

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await this.db.follows.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const count = await this.db.follows.count({
      where: {
        followerId,
        followingId,
      },
    });
    return count > 0;
  }
}
