import { CreateUserInput, UpdateUserInput, UserEntity } from '../domain/types';

/**
 * Persistence port for user accounts. Implemented by a driven adapter
 * (e.g. Prisma). The service layer depends only on this abstraction.
 */
export interface IUserRepository {
  /**
   * Find a user by primary id.
   * @param id - User id.
   * @returns The user, or null if none exists.
   */
  findById(id: number): Promise<UserEntity | null>;

  /**
   * Find a user by email address.
   * @param email - Email to look up.
   * @returns The user, or null if none exists.
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Find a user by username.
   * @param username - Username to look up.
   * @returns The user, or null if none exists.
   */
  findByUsername(username: string): Promise<UserEntity | null>;

  /**
   * Create a new user.
   * @param input - New user fields including the password hash.
   * @returns The created user.
   */
  create(input: CreateUserInput): Promise<UserEntity>;

  /**
   * Update mutable fields of an existing user.
   * @param id - User id to update.
   * @param input - Partial fields to change.
   * @returns The updated user.
   */
  update(id: number, input: UpdateUserInput): Promise<UserEntity>;
}
