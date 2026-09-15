import { PrismaClient, User } from '@prisma/client';
import { getPrismaClient } from './prisma.client';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  bio?: string | null;
  image?: string | null;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * Data access repository for User entities and their follow relationships.
 */
export class UserRepository {
  private readonly prisma: PrismaClient;

  /**
   * Initializes UserRepository.
   *
   * @param {PrismaClient} [prisma] Optional PrismaClient instance for dependency injection
   */
  constructor(prisma: PrismaClient = getPrismaClient()) {
    this.prisma = prisma;
  }

  /**
   * Finds a user by email.
   *
   * @param {string} email User email address
   * @returns {Promise<User | null>} The user or null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Finds a user by username.
   *
   * @param {string} username User handle
   * @returns {Promise<User | null>} The user or null
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Finds a user by ID.
   *
   * @param {number} id User identifier
   * @returns {Promise<User | null>} The user or null
   */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new user record.
   *
   * @param {CreateUserData} data Registration data
   * @returns {Promise<User>} The newly created user
   */
  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        bio: data.bio ?? null,
        image: data.image ?? null,
      },
    });
  }

  /**
   * Updates an existing user record.
   *
   * @param {number} id User identifier
   * @param {UpdateUserData} data User data to update
   * @returns {Promise<User>} Updated user
   */
  async update(id: number, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Checks if follower follows the target user.
   *
   * @param {number} followerId User ID of the follower
   * @param {number} followingId User ID being followed
   * @returns {Promise<boolean>} True if following, false otherwise
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const record = await this.prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return record !== null;
  }

  /**
   * Follows a target user idempotently.
   *
   * @param {number} followerId User ID of the follower
   * @param {number} followingId User ID being followed
   * @returns {Promise<void>}
   */
  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follows.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      create: {
        followerId,
        followingId,
      },
      update: {},
    });
  }

  /**
   * Unfollows a target user idempotently.
   *
   * @param {number} followerId User ID of the follower
   * @param {number} followingId User ID being unfollowed
   * @returns {Promise<void>}
   */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    try {
      await this.prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    } catch {
      // Idempotent: record did not exist
    }
  }
}
