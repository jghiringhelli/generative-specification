import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserRecord,
} from '../../src/repositories/IUserRepository';

export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserRecord>();
  private nextId = 1;

  public async create(data: CreateUserData): Promise<UserRecord> {
    const now = new Date();
    const user: UserRecord = {
      ...data,
      id: String(this.nextId++),
      bio: null,
      image: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  public async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  public async findByUsername(username: string): Promise<UserRecord | null> {
    return [...this.users.values()].find((user) => user.username === username) ?? null;
  }

  public async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    const current = this.users.get(id);
    if (!current) {
      throw new Error(`Missing test user ${id}`);
    }
    const updated = { ...current, ...this.defined(data), updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  private defined(data: UpdateUserData): UpdateUserData {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as UpdateUserData;
  }
}
