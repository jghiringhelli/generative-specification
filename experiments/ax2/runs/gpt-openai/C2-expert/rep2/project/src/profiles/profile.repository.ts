import { PrismaClient } from '@prisma/client';
import { ProfileRecord } from './profile.types';

export interface ProfileRepositoryPort {
  findByUsername(username: string): Promise<ProfileRecord | null>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  follow(followerId: number, followingId: number): Promise<void>;
  unfollow(followerId: number, followingId: number): Promise<void>;
}

export class ProfileRepository implements ProfileRepositoryPort {
  public constructor(private readonly database: PrismaClient) {}

  public findByUsername(username: string): Promise<ProfileRecord | null> {
    return this.database.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true },
    });
  }

  public async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.database.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return follow !== null;
  }

  public async follow(followerId: number, followingId: number): Promise<void> {
    await this.database.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  public async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.database.follow.deleteMany({ where: { followerId, followingId } });
  }
}
