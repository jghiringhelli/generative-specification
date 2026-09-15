import { IUserRepository, UserEntity, CreateUserData, UpdateUserData } from '../IUserRepository';

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, UserEntity> = new Map();
  private nextId = 1;

  /**
   * Finds a user by unique identifier.
   */
  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  /**
   * Finds a user by email address (case-insensitive).
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  /**
   * Finds a user by username (case-insensitive).
   */
  async findByUsername(username: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  /**
   * Stores a new user entity in memory.
   */
  async create(data: CreateUserData): Promise<UserEntity> {
    const id = `user-${this.nextId++}`;
    const user: UserEntity = {
      id,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: data.bio ?? null,
      image: data.image ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  /**
   * Updates an existing user record.
   */
  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    const updated: UserEntity = {
      ...user,
      email: data.email ?? user.email,
      username: data.username ?? user.username,
      passwordHash: data.passwordHash ?? user.passwordHash,
      bio: data.bio !== undefined ? data.bio : user.bio,
      image: data.image !== undefined ? data.image : user.image,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  /**
   * Clears in-memory storage (used for test isolation).
   */
  clear(): void {
    this.users.clear();
    this.nextId = 1;
  }
}
