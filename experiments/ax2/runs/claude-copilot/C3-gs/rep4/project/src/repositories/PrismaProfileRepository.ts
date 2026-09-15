import { PrismaClient } from '@prisma/client';
import { IProfileRepository } from './IProfileRepository';
import { UserEntity } from '../domain/entities';

/**
 * Prisma-backed driven adapter implementing {@link IProfileRepository}.
 */
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async follow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const edge = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return edge !== null;
  }

  async findUserByUsername(username: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }
}
