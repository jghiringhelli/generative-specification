import { PrismaClient } from '@prisma/client';
import { IProfileRepository } from './IProfileRepository';

/**
 * Prisma-backed driven adapter implementing {@link IProfileRepository}.
 */
export class PrismaProfileRepository implements IProfileRepository {
  private readonly prisma: PrismaClient;

  /**
   * @param prisma - Injected Prisma client.
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /** @inheritdoc */
  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  /** @inheritdoc */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  /** @inheritdoc */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const found = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return found !== null;
  }
}
