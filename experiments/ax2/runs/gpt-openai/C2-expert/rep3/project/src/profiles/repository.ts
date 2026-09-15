import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface ProfileRecord {
  readonly user: User;
  readonly following: boolean;
}

export class ProfileRepository {
  /** Finds a profile and its following status for an optional viewer. */
  public async find(username: string, viewerId?: number): Promise<ProfileRecord | null> {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return null;
    if (!viewerId) return { user, following: false };
    const follow = await prisma.follow.findUnique({
      where: { followerId_followedId: { followerId: viewerId, followedId: user.id } },
    });
    return { user, following: follow !== null };
  }

  /** Creates a follow relationship when one does not exist. */
  public async follow(followerId: number, followedId: number): Promise<void> {
    await prisma.follow.upsert({
      where: { followerId_followedId: { followerId, followedId } },
      create: { followerId, followedId },
      update: {},
    });
  }

  /** Removes a follow relationship when present. */
  public async unfollow(followerId: number, followedId: number): Promise<void> {
    await prisma.follow.deleteMany({ where: { followerId, followedId } });
  }
}
