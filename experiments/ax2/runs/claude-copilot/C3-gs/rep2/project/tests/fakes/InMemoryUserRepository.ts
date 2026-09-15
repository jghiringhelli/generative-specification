import { IUserRepository } from '../../src/repositories/IUserRepository';
import { CreateUserInput, UpdateUserInput, User } from '../../src/domain/types';

/**
 * In-memory fake implementing {@link IUserRepository} for fast tests.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<number, User>();
  private nextId = 1;

  /** @inheritdoc */
  async create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user: User = {
      id: this.nextId++,
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      bio: null,
      image: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return { ...user };
  }

  /** @inheritdoc */
  async findById(id: number): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  /** @inheritdoc */
  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return { ...user };
      }
    }
    return null;
  }

  /** @inheritdoc */
  async findByUsername(username: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return { ...user };
      }
    }
    return null;
  }

  /** @inheritdoc */
  async update(id: number, input: UpdateUserInput): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }
    const updated: User = {
      ...existing,
      email: input.email ?? existing.email,
      username: input.username ?? existing.username,
      passwordHash: input.passwordHash ?? existing.passwordHash,
      bio: input.bio !== undefined ? input.bio : existing.bio,
      image: input.image !== undefined ? input.image : existing.image,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }
}
