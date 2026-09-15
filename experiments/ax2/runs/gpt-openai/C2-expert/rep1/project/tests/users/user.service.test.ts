import { verifyToken } from "../../src/auth/token";
import { UserRepositoryPort } from "../../src/users/user.repository";
import {
  CreateUserData,
  UpdateUserData,
  UserRecord
} from "../../src/users/user.types";
import { UserService } from "../../src/users/user.service";

const JWT_SECRET = "user-service-secret";

class InMemoryUserRepository implements UserRepositoryPort {
  private users: UserRecord[] = [];

  public findById(id: number): Promise<UserRecord | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
  }

  public findByEmail(email: string): Promise<UserRecord | null> {
    return Promise.resolve(this.users.find((user) => user.email === email) ?? null);
  }

  public findByUsername(username: string): Promise<UserRecord | null> {
    return Promise.resolve(this.users.find((user) => user.username === username) ?? null);
  }

  public create(data: CreateUserData): Promise<UserRecord> {
    const user = this.record(this.users.length + 1, data);
    this.users.push(user);
    return Promise.resolve(user);
  }

  public update(id: number, data: UpdateUserData): Promise<UserRecord> {
    const existing = this.users.find((user) => user.id === id)!;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.users = this.users.map((user) => (user.id === id ? updated : user));
    return Promise.resolve(updated);
  }

  private record(id: number, data: CreateUserData): UserRecord {
    const now = new Date();
    return { id, ...data, bio: null, image: null, createdAt: now, updatedAt: now };
  }
}

describe("user service", () => {
  it("registers a user with a hashed password and signed token", async () => {
    const repository = new InMemoryUserRepository();
    const service = new UserService(repository, JWT_SECRET);

    const response = await service.register({
      email: "alice@example.com",
      username: "alice",
      password: "password123"
    });
    const stored = await repository.findByEmail("alice@example.com");

    expect(stored?.password).not.toBe("password123");
    expect(verifyToken(response.token, JWT_SECRET).userId).toBe(stored?.id);
  });

  it("rejects duplicate registration credentials", async () => {
    const service = new UserService(new InMemoryUserRepository(), JWT_SECRET);
    await service.register({
      email: "alice@example.com",
      username: "alice",
      password: "password123"
    });

    await expect(
      service.register({
        email: "alice@example.com",
        username: "other",
        password: "password123"
      })
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it("authenticates valid credentials and rejects invalid credentials", async () => {
    const service = new UserService(new InMemoryUserRepository(), JWT_SECRET);
    await service.register({
      email: "alice@example.com",
      username: "alice",
      password: "password123"
    });

    await expect(service.login("alice@example.com", "password123")).resolves.toMatchObject({
      username: "alice"
    });
    await expect(service.login("alice@example.com", "wrong-password")).rejects.toMatchObject({
      statusCode: 422
    });
  });

  it("gets and updates an existing authenticated user", async () => {
    const service = new UserService(new InMemoryUserRepository(), JWT_SECRET);
    const registered = await service.register({
      email: "alice@example.com",
      username: "alice",
      password: "password123"
    });
    const userId = verifyToken(registered.token, JWT_SECRET).userId;

    await expect(service.getCurrent(userId)).resolves.toMatchObject({ username: "alice" });
    await expect(service.update(userId, { bio: "Author" })).resolves.toMatchObject({
      bio: "Author"
    });
  });
});
