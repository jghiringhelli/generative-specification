import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

/**
 * Data-access adapter for the User aggregate and follow relationships.
 * The only place that talks to Prisma for user persistence.
 */
export class UserRepository {
  /** Finds a user by id. */
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  /** Finds a user by email. */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /** Finds a user by username. */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  /** Persists a new user. */
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  /** Updates an existing user. */
  async update(id: number, data: UpdateUserData): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  /** Returns true when follower follows following. */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });
    return follow !== null;
  }

  /** Idempotently creates a follow relationship. */
  async follow(followerId: number, followingId: number): Promise<void> {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {}
    });
  }

  /** Idempotently removes a follow relationship. */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  /** Returns the ids the given user follows. */
  async followingIds(followerId: number): Promise<number[]> {
    const rows = await prisma.follow.findMany({
      where: { followerId },
      select: { followingId: true }
    });
    return rows.map((row) => row.followingId);
  }
}
