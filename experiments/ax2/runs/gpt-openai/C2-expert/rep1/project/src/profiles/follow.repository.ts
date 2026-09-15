import { PrismaClient } from "@prisma/client";

export interface FollowRepositoryPort {
  isFollowing(followerId: number, followedId: number): Promise<boolean>;
  follow(followerId: number, followedId: number): Promise<void>;
  unfollow(followerId: number, followedId: number): Promise<void>;
}

export class FollowRepository implements FollowRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Reports whether one user follows another. */
  public async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followedId: { followerId, followedId } }
    });
    return follow !== null;
  }

  /** Creates a follow relationship if it does not already exist. */
  public async follow(followerId: number, followedId: number): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followedId: { followerId, followedId } },
      create: { followerId, followedId },
      update: {}
    });
  }

  /** Removes a follow relationship if it exists. */
  public async unfollow(followerId: number, followedId: number): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followedId } });
  }
}
