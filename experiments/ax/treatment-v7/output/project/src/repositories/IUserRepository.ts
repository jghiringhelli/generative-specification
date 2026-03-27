import type { User, CreateUserData, UpdateUserData } from '../types/domain';

/**
 * Port interface for user persistence operations.
 *
 * This interface is owned by the domain/service layer.
 * Implementations:
 *   - `PrismaUserRepository` — production (driven adapter using Prisma + PostgreSQL)
 *   - `InMemoryUserRepository` — test doubles (fast, no database required)
 *
 * Services depend on this interface, never on concrete implementations.
 * Inject implementations at the composition root.
 */
export interface IUserRepository {
  /**
   * Find a user by their internal numeric ID.
   *
   * @param id - The user's primary key.
   * @returns The user entity, or null if not found.
   */
  findById(id: number): Promise<User | null>;

  /**
   * Find a user by their email address.
   *
   * @param email - The email address to search for (case-insensitive lookup).
   * @returns The user entity, or null if not found.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by their unique username.
   *
   * @param username - The username to search for (case-sensitive).
   * @returns The user entity, or null if not found.
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Persist a new user record.
   *
   * @param data - The user creation payload. `passwordHash` must be a pre-hashed argon2 string.
   * @returns The created user entity with all fields populated including `id` and timestamps.
   * @throws `ConflictError` — if email or username is already taken.
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Update an existing user record with partial data.
   *
   * @param id - The user's primary key.
   * @param data - Partial update payload. Only provided fields are changed.
   *   `bio` and `image` must have empty strings coerced to `null` before this call.
   * @returns The updated user entity with all fields populated.
   * @throws `NotFoundError` — if no user with the given id exists.
   */
  update(id: number, data: UpdateUserData): Promise<User>;
}
