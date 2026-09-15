import { User } from '@prisma/client';

export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export interface UpdateUserData {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

/**
 * Contract for User persistence operations.
 */
export interface IUserRepository {
  /**
   * Creates a new user record.
   *
   * @param {CreateUserData} data - New user parameters
   * @returns {Promise<User>} The created user
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Finds a user by unique email.
   *
   * @param {string} email - Email address
   * @returns {Promise<User | null>} The user if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Finds a user by unique username.
   *
   * @param {string} username - Username string
   * @returns {Promise<User | null>} The user if found, null otherwise
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Finds a user by primary ID.
   *
   * @param {string} id - User ID
   * @returns {Promise<User | null>} The user if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Updates an existing user record.
   *
   * @param {string} id - User ID to update
   * @param {UpdateUserData} data - User properties to update
   * @returns {Promise<User>} The updated user
   */
  update(id: string, data: UpdateUserData): Promise<User>;
}
