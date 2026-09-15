import { CreateUserData, UpdateUserData, UserEntity } from '../domain/entities';

/**
 * Persistence port for user aggregates. Implemented by driven adapters.
 */
export interface IUserRepository {
  /** Persist a new user and return the stored entity. */
  create(data: CreateUserData): Promise<UserEntity>;

  /** Find a user by primary id, or null when not found. */
  findById(id: string): Promise<UserEntity | null>;

  /** Find a user by unique email, or null when not found. */
  findByEmail(email: string): Promise<UserEntity | null>;

  /** Find a user by unique username, or null when not found. */
  findByUsername(username: string): Promise<UserEntity | null>;

  /** Apply a partial update and return the updated entity. */
  update(id: string, data: UpdateUserData): Promise<UserEntity>;
}
