import { PrismaClient } from '@prisma/client';
import { IProfileRepository } from './IProfileRepository';
import { UserRecord } from './IUserRepository';

export class PrismaProfileRepository implements IProfileRepository {
  public constructor(private readonly database: PrismaClient) {}

  public findByUsername(username: string): Promise<UserRecord | null> {
    return this.database.user.findUnique({ where: { username } });
  }

  public async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    return Boolean(await this.database.follow.findUnique({
      where: { followerId_followedId: { followerId, followedId } },
    }));
  }

  public async follow(followerId: string, followedId: string): Promise<void> {
    await this.database.follow.upsert({
      where: { followerId_followedId: { followerId, followedId } },
      create: { followerId, followedId },
      update: {},
    });
  }

  public async unfollow(followerId: string, followedId: string): Promise<void> {
    await this.database.follow.deleteMany({ where: { followerId, followedId } });
  }
}
