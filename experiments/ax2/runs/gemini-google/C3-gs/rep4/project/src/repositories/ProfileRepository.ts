import { IProfileRepository, ProfileData } from './IProfileRepository';
import { UserEntity } from '../types';
import { prisma } from '../prisma';
import { NotFoundError, ValidationError } from '../errors/AppError';

export class ProfileRepository implements IProfileRepository {
  async findProfile(username: string, currentUserId?: string): Promise<ProfileData | null> {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    if (!user) return null;

    let following = false;
    if (currentUserId) {
      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id
          }
        }
      });
      following = !!followRecord;
    }

    return {
      user: this.mapToEntity(user),
      following
    };
  }

  async follow(followerId: string, followingUsername: string): Promise<ProfileData> {
    const targetUser = await prisma.user.findUnique({
      where: { username: followingUsername }
    });
    if (!targetUser) {
      throw new NotFoundError(`User '${followingUsername}' not found`);
    }

    if (followerId === targetUser.id) {
      throw new ValidationError({ body: ['Cannot follow yourself'] });
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id
        }
      },
      create: {
        followerId,
        followingId: targetUser.id
      },
      update: {}
    });

    return {
      user: this.mapToEntity(targetUser),
      following: true
    };
  }

  async unfollow(followerId: string, followingUsername: string): Promise<ProfileData> {
    const targetUser = await prisma.user.findUnique({
      where: { username: followingUsername }
    });
    if (!targetUser) {
      throw new NotFoundError(`User '${followingUsername}' not found`);
    }

    try {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id
          }
        }
      });
    } catch {
      // If record did not exist, deleting is an idempotent operation
    }

    return {
      user: this.mapToEntity(targetUser),
      following: false
    };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    return !!followRecord;
  }

  private mapToEntity(record: {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    bio: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return {
      id: record.id,
      email: record.email,
      username: record.username,
      passwordHash: record.passwordHash,
      bio: record.bio ?? '',
      image: record.image ?? '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
