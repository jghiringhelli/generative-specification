import { PrismaClient } from '@prisma/client';
import {
  IUserRepository,
  UserEntity,
  CreateUserData,
  UpdateUserData
} from './IUserRepository';

/**
 * Prisma implementation of user repository.
 * Handles all database operations for users and follow relationships.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    return user;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { username }
    });
    return user;
  }

  async findById(id: number): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        bio: data.bio || null,
        image: data.image || null
      }
    });
    return user;
  }

  async update(id: number, data: UpdateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        bio: data.bio,
        image: data.image
      }
    });
    return user;
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

  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.userFollow.create({
      data: {
        followerId,
        followingId
      }
    });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
  }
}
