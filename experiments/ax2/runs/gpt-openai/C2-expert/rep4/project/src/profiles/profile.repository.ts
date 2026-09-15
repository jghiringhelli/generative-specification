import { PrismaClient, User } from "@prisma/client";

export interface IProfileRepository {
  findUser(username: string): Promise<User | null>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  follow(followerId: number, followingId: number): Promise<void>;
  unfollow(followerId: number, followingId: number): Promise<void>;
}

export class ProfileRepository implements IProfileRepository {
  public constructor(private readonly database: PrismaClient) {}

  public findUser(username: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { username } });
  }

  public async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.database.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });
    return follow !== null;
  }

  public async follow(followerId: number, followingId: number): Promise<void> {
    await this.database.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {}
    });
  }

  public async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.database.follow.deleteMany({ where: { followerId, followingId } });
  }
}
