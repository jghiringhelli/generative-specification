import { IUserRepository } from '../../src/repositories/IUserRepository';
import { CreateUserInput, UpdateUserInput, UserEntity } from '../../src/domain/types';

/**
 * In-memory fake implementation of {@link IUserRepository} for tests. Behaves
 * like the real adapter (unique email/username) without a database.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly users: UserEntity[] = [];
  private nextId = 1;

  /** @inheritdoc */
  async findById(id: number): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  /** @inheritdoc */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  /** @inheritdoc */
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.username === username) ?? null;
  }

  /** @inheritdoc */
  async create(input: CreateUserInput): Promise<UserEntity> {
    const now = new Date();
    const user: UserEntity = {
      id: this.nextId++,
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      bio: null,
      image: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.push(user);
    return { ...user };
  }

  /** @inheritdoc */
  async update(id: number, input: UpdateUserInput): Promise<UserEntity> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    if (input.email !== undefined) user.email = input.email;
    if (input.username !== undefined) user.username = input.username;
    if (input.passwordHash !== undefined) user.passwordHash = input.passwordHash;
    if (input.bio !== undefined) user.bio = input.bio;
    if (input.image !== undefined) user.image = input.image;
    user.updatedAt = new Date();
    return { ...user };
  }
}
