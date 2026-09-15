import type { PrismaClient } from '@prisma/client';
import type { IProfileRepository, ProfileRecord } from './IProfileRepository';

export class PrismaProfileRepository implements IProfileRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Finds a public profile and determines whether the viewer follows it. */
  public async findByUsername(username: string, viewerId?: string): Promise<ProfileRecord | null> {
    const user = await this.client.user.findUnique({
      where: { username },
      include: { followers: true },
    });
    if (!user) return null;
    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: viewerId
        ? user.followers.some(({ followerId }) => followerId === viewerId)
        : false,
    };
  }

  /** Creates a following relationship if it does not already exist. */
  public async follow(followerId: string, followedId: string): Promise<void> {
    await this.client.follow.upsert({
      where: { followerId_followedId: { followerId, followedId } },
      create: { followerId, followedId },
      update: {},
    });
  }

  /** Removes a following relationship if present. */
  public async unfollow(followerId: string, followedId: string): Promise<void> {
    await this.client.follow.deleteMany({ where: { followerId, followedId } });
  }
}
