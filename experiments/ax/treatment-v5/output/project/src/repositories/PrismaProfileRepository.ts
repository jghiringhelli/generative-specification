
/**
 * Prisma implementation of IProfileRepository.
 * Profiles are read-only views of User records with following status.
 */

import { PrismaClient } from '@prisma/client';
import type { IProfile, IProfileRepository } from './IProfileRepository';
import { NotFoundError, ConflictError } from '../errors/AppError';

export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByUsername(
    username: string,
    currentUserId: number | null
  ): Promise<IProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        bio: true,
        image: true,
        followedBy: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { followerId: true }
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
      following: currentUserId
        ? Array.isArray(user.followedBy) && user.followedBy.length > 0
        : false
    };
  }

  async follow(currentUserId: number, targetUsername: string): Promise<IProfile> {
    // Look up target user
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true, bio: true, image: true }
    });

    if (!targetUser) {
      throw new NotFoundError('User', targetUsername);
    }

    // Cannot follow yourself
    if (targetUser.id === currentUserId) {
      throw new ConflictError('Cannot follow yourself');
    }

    // Create follow relationship
    try {
      await this.prisma.userFollow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUser.id
        }
      });
    } catch (error: any) {
      // Prisma P2002: Unique constraint violation (already following)
      if (error.code === 'P2002') {
        throw new ConflictError('Already following this user');
      }
      throw error;
    }

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true
    };
  }

  async unfollow(currentUserId: number, targetUsername: string): Promise<IProfile> {
    // Look up target user
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true, bio: true, image: true }
    });

    if (!targetUser) {
      throw new NotFoundError('User', targetUsername);
    }

    // Delete follow relationship
    try {
      await this.prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUser.id
          }
        }
      });
    } catch (error: any) {
      // Prisma P2025: Record not found (not currently following)
      if (error.code === 'P2025') {
        throw new NotFoundError('Follow relationship');
      }
      throw error;
    }

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
