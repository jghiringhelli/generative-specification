import { PrismaClient } from '@prisma/client';
import {
  IProfileRepository,
  ProfileRecord,
} from './IProfileRepository';

export class PrismaProfileRepository implements IProfileRepository {
  public constructor(private readonly client: PrismaClient) {}

  public findByUsername(username: string): Promise<ProfileRecord | null> {
    return this.client.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true },
    });
  }

  public async isFollowing(
    followerId: string,
    followedId: string,
  ): Promise<boolean> {
    const follow = await this.client.follow.findUnique({
      where: { followerId_followedId: { followerId, followedId } },
    });
    return follow !== null;
  }

  public async follow(followerId: string, followedId: string): Promise<void> {
    await this.client.follow.upsert({
      where: { followerId_followedId: { followerId, followedId } },
      create: { followerId, followedId },
      update: {},
    });
  }

  public async unfollow(followerId: string, followedId: string): Promise<void> {
    await this.client.follow.deleteMany({ where: { followerId, followedId } });
  }
}
