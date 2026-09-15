import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** Data required to create a new user record. */
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

/** Fields that may be updated on a user record. */
export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * Data-access layer for User entities. Encapsulates all Prisma calls so the
 * service and route layers never touch the database directly.
 */
export class UserRepository {
  /**
   * Persists a new user.
   * @param data the user creation payload
   * @returns the created user
   */
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  /**
   * Finds a user by email.
   * @param email the email to search for
   * @returns the matching user or null
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Finds a user by username.
   * @param username the username to search for
   * @returns the matching user or null
   */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  /**
   * Finds a user by id.
   * @param id the user id
   * @returns the matching user or null
   */
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  /**
   * Updates a user record.
   * @param id the user id
   * @param data the fields to update
   * @returns the updated user
   */
  async update(id: number, data: UpdateUserData): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }
}
