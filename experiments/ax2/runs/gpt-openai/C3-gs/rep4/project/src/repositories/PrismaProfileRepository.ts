import type { PrismaClient } from '@prisma/client';
import type {
  IProfileRepository,
  ProfileRecord,
} from './IProfileRepository';

export class PrismaProfileRepository implements IProfileRepository {
  public constructor(private readonly database: PrismaClient) {}

  /** Finds a profile and its following state for an optional viewer. */
  public async findByUsername(
    username: string,
    viewerId?: string,
  ): Promise<ProfileRecord | null> {
    const user = await this.database.user.findUnique({ where: { username } });
    if (!user) {
      return null;
    }
    const following = viewerId
      ? Boolean(await this.database.follow.findUnique({
        where: { followerId_followedId: { followerId: viewerId, followedId: user.id } },
      }))
      : false;
    return { user, following };
  }

  /** Creates a following relationship if it does not already exist. */
  public async follow(followerId: string, followedId: string): Promise<void> {
    await this.database.follow.upsert({
      where: { followerId_followedId: { followerId, followedId } },
      create: { followerId, followedId },
      update: {},
    });
  }

  /** Removes a following relationship if present. */
  public async unfollow(followerId: string, followedId: string): Promise<void> {
    await this.database.follow.deleteMany({ where: { followerId, followedId } });
  }
}
