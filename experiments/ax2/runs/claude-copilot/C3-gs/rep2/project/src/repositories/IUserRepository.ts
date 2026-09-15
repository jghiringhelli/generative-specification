import { CreateUserInput, UpdateUserInput, User } from '../domain/types';

/**
 * Persistence port for user aggregates. Implemented by driven adapters
 * (e.g. a Prisma-backed repository).
 */
export interface IUserRepository {
  /**
   * Persist a new user.
   * @param input - New user fields including the password hash.
   * @returns The created user.
   */
  create(input: CreateUserInput): Promise<User>;

  /**
   * Find a user by primary id.
   * @param id - User id.
   * @returns The user, or null if not found.
   */
  findById(id: number): Promise<User | null>;

  /**
   * Find a user by email address.
   * @param email - Email address.
   * @returns The user, or null if not found.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by username.
   * @param username - Username.
   * @returns The user, or null if not found.
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Update mutable fields on a user.
   * @param id - User id.
   * @param input - Fields to update.
   * @returns The updated user.
   */
  update(id: number, input: UpdateUserInput): Promise<User>;
}
