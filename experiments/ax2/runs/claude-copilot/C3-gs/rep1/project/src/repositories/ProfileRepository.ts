import { prisma } from '../config/prisma';
import {
  IProfileRepository,
} from './IProfileRepository';

/**
 * Prisma-backed implementation of the profile follow persistence port.
 */
export class ProfileRepository implements IProfileRepository {
  /** @inheritdoc */
  async follow(followerId: number, followingId: number): Promise<void> {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });
  }

  /** @inheritdoc */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  /** @inheritdoc */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const found = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return found !== null;
  }

  /** @inheritdoc */
  async findFollowingIds(followerId: number): Promise<number[]> {
    const rows = await prisma.follow.findMany({
      where: { followerId },
      select: { followingId: true },
    });
    return rows.map((row) => row.followingId);
  }
}
