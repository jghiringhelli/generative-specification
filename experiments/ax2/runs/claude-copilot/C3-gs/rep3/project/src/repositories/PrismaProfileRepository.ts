import { PrismaClient } from '@prisma/client';
import { IProfileRepository } from './IProfileRepository';

/** PrismaClient-backed implementation of {@link IProfileRepository}. */
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const found = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return found !== null;
  }
}
