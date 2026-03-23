/** User domain entity returned from repository operations. */
export interface User {
  readonly id: number;
  readonly email: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Data required to create a new user. */
export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
}

/** Data for updating an existing user (all fields optional). */
export interface UpdateUserData {
  readonly email?: string;
  readonly username?: string;
  readonly passwordHash?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

/**
 * Port interface for user persistence operations.
 * Services depend on this interface; Prisma implementation is injected at composition root.
 */
export interface IUserRepository {
  /**
   * Find a user by email address.
   * @param email - The email to search for.
   * @returns The user if found, null otherwise.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by username.
   * @param username - The username to search for.
   * @returns The user if found, null otherwise.
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Find a user by numeric ID.
   * @param id - The user's primary key.
   * @returns The user if found, null otherwise.
   */
  findById(id: number): Promise<User | null>;

  /**
   * Create a new user record.
   * @param data - The user creation data.
   * @returns The created user.
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Update an existing user record.
   * @param id - The user's primary key.
   * @param data - The fields to update.
   * @returns The updated user.
   */
  update(id: number, data: UpdateUserData): Promise<User>;
}
