
/**
 * Prisma implementation of IUserRepository.
 * Handles all user-related database operations.
 */

import { PrismaClient } from '@prisma/client';
import type {
  IUser,
  IUserProfile,
  IUserRepository
} from './IUserRepository';
import { NotFoundError, ConflictError } from '../errors/AppError';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<IUser | null> {
    return await this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return await this.prisma.user.findUnique({
      where: { username }
    });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<IUser> {
    try {
      return await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash: data.passwordHash
        }
      });
    } catch (error: any) {
      // Prisma P2002: Unique constraint violation
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictError(`${field} already taken`);
      }
      throw error;
    }
  }

  async update(
    id: number,
    data: {
      email?: string;
      username?: string;
      passwordHash?: string;
      bio?: string | null;
      image?: string | null;
    }
  ): Promise<IUser> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data
      });
    } catch (error: any) {
      // Prisma P2025: Record not found
      if (error.code === 'P2025') {
        throw new NotFoundError('User', id);
      }
      // Prisma P2002: Unique constraint violation
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictError(`${field} already taken`);
      }
      throw error;
    }
  }

  async getProfile(
    username: string,
    currentUserId: number | null
  ): Promise<IUserProfile | null> {
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

  async follow(followerId: number, followingId: number): Promise<void> {
    try {
      await this.prisma.userFollow.create({
        data: {
          followerId,
          followingId
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictError('Already following this user');
      }
      throw error;
    }
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    try {
      await this.prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Follow relationship');
      }
      throw error;
    }
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    return follow !== null;
  }
}
