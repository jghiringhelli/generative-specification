import { PrismaClient, Prisma } from '@prisma/client';
import type { User, CreateUserData, UpdateUserData } from '../types/domain';
import type { IUserRepository } from './IUserRepository';
import { ConflictError, NotFoundError } from '../errors/AppError';

/** Prisma error code for unique constraint violations. */
const PRISMA_UNIQUE_VIOLATION = 'P2002';
/** Prisma error code for record-not-found on update/delete. */
const PRISMA_NOT_FOUND = 'P2025';

/**
 * PostgreSQL-backed implementation of `IUserRepository` via Prisma.
 *
 * All database I/O is confined to this adapter. Domain services import
 * the `IUserRepository` interface only — never this class directly.
 * Wire at the composition root (`src/server.ts`).
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find a user by their internal numeric ID.
   *
   * @param id - The user's primary key
   * @returns The user entity or null if not found
   */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find a user by their email address (case-insensitive via lowercase storage).
   *
   * @param email - Email to search for
   * @returns The user entity or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  /**
   * Find a user by their unique username (case-sensitive).
   *
   * @param username - Username to search for
   * @returns The user entity or null if not found
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /**
   * Create a new user record.
   *
   * @param data - User creation payload; `passwordHash` must be a pre-hashed argon2 string
   * @returns The created user with all fields including id and timestamps
   * @throws `ConflictError` if email or username is already taken
   */
  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          username: data.username,
          passwordHash: data.passwordHash,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_UNIQUE_VIOLATION) {
        const target = (err.meta?.target as string[] | undefined) ?? [];
        if (target.includes('email')) throw new ConflictError('email', 'has already been taken');
        if (target.includes('username')) throw new ConflictError('username', 'has already been taken');
      }
      throw err;
    }
  }

  /**
   * Update an existing user with partial data.
   *
   * @param id - The user's primary key
   * @param data - Partial update payload; only provided fields are changed
   * @returns The updated user entity
   * @throws `NotFoundError` if no user with the given id exists
   * @throws `ConflictError` if the new email or username is already taken
   */
  async update(id: number, data: UpdateUserData): Promise<User> {
    try {
      const patch: Prisma.UserUpdateInput = {};
      if (data.email !== undefined) patch.email = data.email.toLowerCase();
      if (data.username !== undefined) patch.username = data.username;
      if (data.passwordHash !== undefined) patch.passwordHash = data.passwordHash;
      if (data.bio !== undefined) patch.bio = data.bio;
      if (data.image !== undefined) patch.image = data.image;
      return await this.prisma.user.update({ where: { id }, data: patch });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === PRISMA_NOT_FOUND) throw new NotFoundError('user');
        if (err.code === PRISMA_UNIQUE_VIOLATION) {
          const target = (err.meta?.target as string[] | undefined) ?? [];
          if (target.includes('email')) throw new ConflictError('email', 'has already been taken');
          if (target.includes('username')) throw new ConflictError('username', 'has already been taken');
        }
      }
      throw err;
    }
  }
}
