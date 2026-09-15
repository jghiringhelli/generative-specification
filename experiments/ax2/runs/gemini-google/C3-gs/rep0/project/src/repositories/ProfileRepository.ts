// src/repositories/ProfileRepository.ts
import { PrismaClient } from '@prisma/client';
import { IProfileRepository } from './IProfileRepository';
import { ProfileResponse } from '../types';
import { NotFoundError } from '../errors/AppError';
import { prisma as defaultPrisma } from '../prisma';

export class ProfileRepository implements IProfileRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  async findByUsername(username: string, currentUserId?: string): Promise<ProfileResponse | null> {
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

  async isFollowing(followerId: string, targetUserId: string): Promise<boolean> {
    const followRecord = await this.prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId
        }
      }
    });

    return !!followRecord;
  }

  async followUser(followerId: string, usernameToFollow: string): Promise<ProfileResponse> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: usernameToFollow }
    });

    if (!targetUser) {
      throw new NotFoundError(`Profile ${usernameToFollow} not found`);
    }

    if (followerId !== targetUser.id) {
      await this.prisma.follows.upsert({
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

  async unfollowUser(followerId: string, usernameToUnfollow: string): Promise<ProfileResponse> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: usernameToUnfollow }
    });

    if (!targetUser) {
      throw new NotFoundError(`Profile ${usernameToUnfollow} not found`);
    }

    try {
      await this.prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id
          }
        }
      });
    } catch (_err) {
      // If already not following, delete throws P2025; ignore safely
    }

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
