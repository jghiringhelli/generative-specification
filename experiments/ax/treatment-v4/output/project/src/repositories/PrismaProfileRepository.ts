import { PrismaClient } from '@prisma/client';
import { IProfileRepository, ProfileEntity } from './IProfileRepository';

/**
 * Prisma implementation of profile repository.
 * Profiles are read-only views of users with follow status.
 */
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByUsername(username: string, currentUserId?: number): Promise<ProfileEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        bio: true,
        image: true,
        followedBy: currentUserId
          ? {
              where: {
                followerId: currentUserId
              }
            }
          : false
      }
    });

    if (!user) {
      return null;
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: currentUserId ? (user.followedBy as any[]).length > 0 : false
    };
  }
}
