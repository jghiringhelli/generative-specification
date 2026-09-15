import { PrismaClient } from '@prisma/client';
import { IProfileRepository } from './IProfileRepository';

/**
 * Prisma-backed driven adapter for {@link IProfileRepository}.
 */
export class PrismaProfileRepository implements IProfileRepository {
  /**
   * @param prisma - Shared Prisma client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    const row = await this.prisma.follow.findUnique({
      where: { followerId_followedId: { followerId, followedId } }
    });
    return row !== null;
  }

  /** @inheritdoc */
  async follow(followerId: number, followedId: number): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followedId: { followerId, followedId } },
      create: { followerId, followedId },
      update: {}
    });
  }

  /** @inheritdoc */
  async unfollow(followerId: number, followedId: number): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followedId } });
  }

  /** @inheritdoc */
  async findFollowedIds(followerId: number): Promise<number[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId },
      select: { followedId: true }
    });
    return rows.map((r) => r.followedId);
  }
}
