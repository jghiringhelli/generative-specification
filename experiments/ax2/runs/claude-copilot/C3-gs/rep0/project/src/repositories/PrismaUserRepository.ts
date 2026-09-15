import { PrismaClient } from '@prisma/client';
import { IUserRepository } from './IUserRepository';
import { CreateUserInput, UpdateUserInput, UserEntity } from '../domain/types';

/**
 * Prisma-backed driven adapter for {@link IUserRepository}.
 */
export class PrismaUserRepository implements IUserRepository {
  /**
   * @param prisma - Shared Prisma client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find a user by id.
   * @param id - User id.
   * @returns The user or null.
   */
  async findById(id: number): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find a user by email.
   * @param email - Email address.
   * @returns The user or null.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find a user by username.
   * @param username - Username.
   * @returns The user or null.
   */
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /**
   * Create a new user.
   * @param input - New user fields.
   * @returns The created user.
   */
  async create(input: CreateUserInput): Promise<UserEntity> {
    return this.prisma.user.create({ data: input });
  }

  /**
   * Update mutable fields of a user. Undefined fields are ignored.
   * @param id - User id.
   * @param input - Partial fields.
   * @returns The updated user.
   */
  async update(id: number, input: UpdateUserInput): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: input.email,
        username: input.username,
        passwordHash: input.passwordHash,
        bio: input.bio,
        image: input.image
      }
    });
  }
}
