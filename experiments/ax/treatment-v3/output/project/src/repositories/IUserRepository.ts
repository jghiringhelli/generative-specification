/**
 * User repository port interface.
 * Defines data access contract for User entity.
 * Implementations: PrismaUserRepository (production), InMemoryUserRepository (tests).
 */
export interface IUserRepository {
  /**
   * Find user by email address.
   * @param email - User email (unique)
   * @returns User entity or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by username.
   * @param username - Username (unique)
   * @returns User entity or null if not found
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Find user by ID.
   * @param id - User ID (primary key)
   * @returns User entity or null if not found
   */
  findById(id: number): Promise<User | null>;

  /**
   * Create a new user.
   * @param data - User creation data
   * @returns Created user entity
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Update an existing user.
   * @param id - User ID
   * @param data - Partial user update data
   * @returns Updated user entity
   */
  update(id: number, data: UpdateUserData): Promise<User>;
}

export interface User {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  bio?: string | null;
  image?: string | null;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  passwordHash?: string;
  bio?: string | null;
  image?: string | null;
}
