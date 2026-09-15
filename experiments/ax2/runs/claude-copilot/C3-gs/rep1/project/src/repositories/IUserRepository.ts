import { User } from '@prisma/client';

/**
 * Input for creating a user record.
 */
export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
}

/**
 * Partial fields for updating a user record.
 */
export interface UpdateUserData {
  email?: string;
  username?: string;
  passwordHash?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * Persistence port for user aggregate operations.
 */
export interface IUserRepository {
  /**
   * Create a new user.
   * @param data - Email, username, and password hash.
   * @returns The persisted user.
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Find a user by id.
   * @param id - User id.
   * @returns The user or null if not found.
   */
  findById(id: number): Promise<User | null>;

  /**
   * Find a user by email.
   * @param email - Email address.
   * @returns The user or null if not found.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by username.
   * @param username - Username.
   * @returns The user or null if not found.
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Update mutable user fields.
   * @param id - User id.
   * @param data - Fields to update.
   * @returns The updated user.
   */
  update(id: number, data: UpdateUserData): Promise<User>;
}
