import { CreateUserInput, UpdateUserInput, User } from '../types/domain';

/**
 * Persistence contract for user accounts. Implemented by driven adapters.
 */
export interface IUserRepository {
  /** Persist a new user and return the created record. */
  create(input: CreateUserInput): Promise<User>;
  /** Find a user by primary key, or null if none exists. */
  findById(id: number): Promise<User | null>;
  /** Find a user by unique email, or null if none exists. */
  findByEmail(email: string): Promise<User | null>;
  /** Find a user by unique username, or null if none exists. */
  findByUsername(username: string): Promise<User | null>;
  /** Apply a partial update to a user and return the updated record. */
  update(id: number, input: UpdateUserInput): Promise<User>;
}
