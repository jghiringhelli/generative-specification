import {
  CreateUserRecord,
  IUserRepository,
  UpdateUserRecord,
  UserRecord,
} from '../../src/repositories/IUserRepository';

export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserRecord>();
  private nextId = 1;

  public findById(id: string): Promise<UserRecord | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  public findByEmail(email: string): Promise<UserRecord | null> {
    return Promise.resolve(
      [...this.users.values()].find((user) => user.email === email) ?? null,
    );
  }

  public findByUsername(username: string): Promise<UserRecord | null> {
    return Promise.resolve(
      [...this.users.values()].find((user) => user.username === username) ?? null,
    );
  }

  public create(data: CreateUserRecord): Promise<UserRecord> {
    const now = new Date();
    const user: UserRecord = {
      id: String(this.nextId++),
      ...data,
      bio: null,
      image: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }

  public update(id: string, data: UpdateUserRecord): Promise<UserRecord> {
    const current = this.users.get(id);
    if (!current) throw new Error(`Missing test user ${id}`);
    const updated = { ...current, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return Promise.resolve(updated);
  }
}
