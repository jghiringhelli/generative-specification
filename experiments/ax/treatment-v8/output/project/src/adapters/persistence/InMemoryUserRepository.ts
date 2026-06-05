/**
 * In-memory {@link IUserRepository}.
 *
 * A genuine working implementation (a Fake, not a mock) of the persistence
 * port: it enforces the same uniqueness invariants the database does. Used as
 * the driven adapter in subcutaneous integration tests so the full HTTP →
 * service → token/hash path runs without external infrastructure, and usable
 * for local development without a database. Production wiring uses
 * {@link PrismaUserRepository}.
 */
import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../errors/AppError.js';
import type {
  IUserRepository,
  NewUser,
  User,
  UserUpdate,
} from '../../repositories/IUserRepository.js';

export class InMemoryUserRepository implements IUserRepository {
  private readonly usersById = new Map<string, User>();

  /** @inheritdoc */
  create(input: NewUser): Promise<User> {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: input.email,
      username: input.username,
      bio: null,
      image: null,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    this.usersById.set(user.id, user);
    return Promise.resolve(user);
  }

  /** @inheritdoc */
  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.usersById.get(id) ?? null);
  }

  /** @inheritdoc */
  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.find((user) => user.email === email));
  }

  /** @inheritdoc */
  findByUsername(username: string): Promise<User | null> {
    return Promise.resolve(this.find((user) => user.username === username));
  }

  /** @inheritdoc */
  update(id: string, changes: UserUpdate): Promise<User> {
    const existing = this.usersById.get(id);
    if (!existing) return Promise.reject(new NotFoundError('User', id));
    const updated: User = {
      ...existing,
      ...(changes.email !== undefined ? { email: changes.email } : {}),
      ...(changes.username !== undefined ? { username: changes.username } : {}),
      ...(changes.bio !== undefined ? { bio: changes.bio } : {}),
      ...(changes.image !== undefined ? { image: changes.image } : {}),
      ...(changes.passwordHash !== undefined ? { passwordHash: changes.passwordHash } : {}),
      updatedAt: new Date(),
    };
    this.usersById.set(id, updated);
    return Promise.resolve(updated);
  }

  /** First stored user matching `predicate`, or `null`. */
  private find(predicate: (user: User) => boolean): User | null {
    for (const user of this.usersById.values()) {
      if (predicate(user)) return user;
    }
    return null;
  }

  /** @inheritdoc */
  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  /** @inheritdoc */
  async existsByUsername(username: string): Promise<boolean> {
    return (await this.findByUsername(username)) !== null;
  }
}
