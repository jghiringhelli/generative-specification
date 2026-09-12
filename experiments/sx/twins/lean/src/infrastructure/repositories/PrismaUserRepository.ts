import { PrismaClient } from '@prisma/client';
import { IUserRepository, CreateUserData, UpdateUserData } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<User> {
    return await this.prisma.user.create({ data });
  }

  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { username } });
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    return await this.prisma.user.update({ where: { id }, data });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId }
      }
    });
    return !!follow;
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId }
      },
      update: {},
      create: { followerId, followingId }
    });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId }
    });
  }

  async getFollowingIds(userId: number): Promise<number[]> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    return following.map(f => f.followingId);
  }
}
