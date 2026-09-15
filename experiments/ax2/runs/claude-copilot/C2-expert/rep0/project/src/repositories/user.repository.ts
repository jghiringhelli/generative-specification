import type { Prisma, User } from '@prisma/client';
import { prisma } from '../lib/prisma';

/** Data required to create a new user record. */
export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

/** Fields that can be updated on an existing user. */
export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * Persistence adapter for {@link User} entities. All database access for users
 * flows through this class so that route/service layers never touch Prisma.
 */
export class UserRepository {
  private readonly client: Prisma.UserDelegate;

  constructor(client: Prisma.UserDelegate = prisma.user) {
    this.client = client;
  }

  /**
   * Creates a new user.
   * @param data The user creation data.
   * @returns The created {@link User}.
   */
  async create(data: CreateUserData): Promise<User> {
    return this.client.create({ data });
  }

  /**
   * Finds a user by email.
   * @param email The email to look up.
   * @returns The matching {@link User} or `null`.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.client.findUnique({ where: { email } });
  }

  /**
   * Finds a user by username.
   * @param username The username to look up.
   * @returns The matching {@link User} or `null`.
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.client.findUnique({ where: { username } });
  }

  /**
   * Finds a user by primary key.
   * @param id The user id.
   * @returns The matching {@link User} or `null`.
   */
  async findById(id: number): Promise<User | null> {
    return this.client.findUnique({ where: { id } });
  }

  /**
   * Updates an existing user.
   * @param id The user id.
   * @param data The fields to update.
   * @returns The updated {@link User}.
   */
  async update(id: number, data: UpdateUserData): Promise<User> {
    return this.client.update({ where: { id }, data });
  }
}
