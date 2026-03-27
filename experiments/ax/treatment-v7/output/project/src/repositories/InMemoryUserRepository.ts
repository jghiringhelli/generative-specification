import type { User, CreateUserData, UpdateUserData } from '../types/domain';
import type { IUserRepository } from './IUserRepository';
import { ConflictError, NotFoundError } from '../errors/AppError';

/**
 * In-memory implementation of `IUserRepository` for use in unit tests.
 *
 * Satisfies the full port contract without requiring a database connection.
 * Use in tests by injecting into `UserService` constructor — no mocking needed.
 *
 * @example
 * const repo = new InMemoryUserRepository();
 * const service = new UserService(repo);
 * beforeEach(() => repo.clear());
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<number, User>();
  private nextId = 1;

  /**
   * Seed initial user records for test setup.
   *
   * @param users - User entities to pre-populate the store with
   */
  seed(users: User[]): void {
    for (const user of users) {
      this.store.set(user.id, user);
      if (user.id >= this.nextId) this.nextId = user.id + 1;
    }
  }

  /**
   * Remove all stored users and reset the id counter.
   * Call in `beforeEach` to isolate tests.
   */
  clear(): void {
    this.store.clear();
    this.nextId = 1;
  }

  /** @inheritdoc */
  async findById(id: number): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  /** @inheritdoc */
  async findByEmail(email: string): Promise<User | null> {
    const lower = email.toLowerCase();
    for (const user of this.store.values()) {
      if (user.email === lower) return user;
    }
    return null;
  }

  /** @inheritdoc */
  async findByUsername(username: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.username === username) return user;
    }
    return null;
  }

  /** @inheritdoc */
  async create(data: CreateUserData): Promise<User> {
    for (const user of this.store.values()) {
      if (user.email === data.email.toLowerCase()) {
        throw new ConflictError('email', 'has already been taken');
      }
      if (user.username === data.username) {
        throw new ConflictError('username', 'has already been taken');
      }
    }
    const now = new Date();
    const user: User = {
      id: this.nextId++,
      email: data.email.toLowerCase(),
      username: data.username,
      passwordHash: data.passwordHash,
      bio: null,
      image: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(user.id, user);
    return user;
  }

  /** @inheritdoc */
  async update(id: number, data: UpdateUserData): Promise<User> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError('user');
    for (const user of this.store.values()) {
      if (user.id === id) continue;
      if (data.email !== undefined && user.email === data.email.toLowerCase()) {
        throw new ConflictError('email', 'has already been taken');
      }
      if (data.username !== undefined && user.username === data.username) {
        throw new ConflictError('username', 'has already been taken');
      }
    }
    const updated: User = {
      ...existing,
      ...(data.email !== undefined && { email: data.email.toLowerCase() }),
      ...(data.username !== undefined && { username: data.username }),
      ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.image !== undefined && { image: data.image }),
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }
}
