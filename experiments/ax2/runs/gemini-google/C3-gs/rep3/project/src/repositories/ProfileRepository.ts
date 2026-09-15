// src/repositories/ProfileRepository.ts
import { PrismaClient } from '@prisma/client';
import { IProfileRepository, ProfileRecord } from './IProfileRepository';
import { NotFoundError } from '../errors/AppError';

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async isFollowing(followerId: string, targetUserId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId
        }
      }
    });
    return !!follow;
  }

  public async findByUsername(username: string, currentUserId?: string): Promise<ProfileRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return null;
    }

    let following = false;
    if (currentUserId) {
      following = await this.isFollowing(currentUserId, user.id);
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    };
  }

  public async follow(followerId: string, username: string): Promise<ProfileRecord> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      throw new NotFoundError(`User with username '${username}' not found`);
    }

    if (followerId !== targetUser.id) {
      await this.prisma.follow.upsert({
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
    }

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true
    };
  }

  public async unfollow(followerId: string, username: string): Promise<ProfileRecord> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      throw new NotFoundError(`User with username '${username}' not found`);
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId: targetUser.id
      }
    });

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
