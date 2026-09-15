import { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";

/** Data required to create a new user record. */
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

/** Fields that may be updated on an existing user. */
export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * Data-access layer for User records. The only place that touches
 * `prisma.user` for user persistence concerns.
 */
export class UserRepository {
  /**
   * Create a new user.
   * @param data The user creation payload.
   * @returns The persisted user.
   */
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  /**
   * Find a user by id.
   * @param id The user id.
   * @returns The user, or null when not found.
   */
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find a user by email.
   * @param email The email address.
   * @returns The user, or null when not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find a user by username.
   * @param username The username.
   * @returns The user, or null when not found.
   */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  /**
   * Update an existing user.
   * @param id The user id.
   * @param data The fields to update.
   * @returns The updated user.
   */
  async update(id: number, data: UpdateUserData): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  /**
   * Determine whether one user follows another.
   * @param followerId The potential follower id.
   * @param followingId The followed user id.
   * @returns True when followerId follows followingId.
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const result = await prisma.user.findFirst({
      where: { id: followerId, following: { some: { id: followingId } } },
      select: { id: true },
    });
    return result !== null;
  }

  /**
   * Follow a user (idempotent).
   * @param followerId The follower id.
   * @param followingId The user to follow.
   */
  async follow(followerId: number, followingId: number): Promise<void> {
    await prisma.user.update({
      where: { id: followerId },
      data: { following: { connect: { id: followingId } } },
    });
  }

  /**
   * Unfollow a user (idempotent).
   * @param followerId The follower id.
   * @param followingId The user to unfollow.
   */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    await prisma.user.update({
      where: { id: followerId },
      data: { following: { disconnect: { id: followingId } } },
    });
  }
}
