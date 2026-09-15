import { PrismaClient } from "@prisma/client";
import { ProfileRecord } from "./profile.types";

export interface ProfileRepositoryPort {
  findByUsername(username: string): Promise<ProfileRecord | null>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  follow(followerId: number, followingId: number): Promise<void>;
  unfollow(followerId: number, followingId: number): Promise<void>;
}

export class ProfileRepository implements ProfileRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Finds a profile by username. */
  public findByUsername(username: string): Promise<ProfileRecord | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true }
    });
  }

  /** Determines whether one user follows another. */
  public async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });
    return follow !== null;
  }

  /** Creates a follow relationship idempotently. */
  public async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {}
    });
  }

  /** Removes a follow relationship idempotently. */
  public async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }
}
