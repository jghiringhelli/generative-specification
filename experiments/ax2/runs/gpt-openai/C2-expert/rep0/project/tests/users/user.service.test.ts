import { UserRepositoryPort } from "../../src/users/user.repository";
import { UserService } from "../../src/users/user.service";
import { CreateUserData, UpdateUserData, UserRecord } from "../../src/users/user.types";

class FakeUserRepository implements UserRepositoryPort {
  private users: UserRecord[] = [];
  private nextId = 1;

  public async create(data: CreateUserData): Promise<UserRecord> {
    const user = { id: this.nextId++, ...data, bio: null, image: null };
    this.users = [...this.users, user];
    return user;
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  public async findById(id: number): Promise<UserRecord | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  public async update(id: number, data: UpdateUserData): Promise<UserRecord> {
    const current = await this.findById(id);
    if (!current) throw new Error("User not found");
    const updated = { ...current, ...data };
    this.users = this.users.map((user) => user.id === id ? updated : user);
    return updated;
  }
}

const registration = {
  email: "reader@example.com",
  username: "reader",
  password: "secure-password"
};

describe("UserService authentication behavior", () => {
  it("registers a user without exposing the password", async () => {
    const service = new UserService(new FakeUserRepository(), "test-secret");
    const response = await service.register(registration);
    expect(response).not.toHaveProperty("password");
    expect(response.token).toEqual(expect.any(String));
  });

  it("returns 422 when registering a duplicate email", async () => {
    const service = new UserService(new FakeUserRepository(), "test-secret");
    await service.register(registration);
    await expect(service.register({ ...registration, username: "other" }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  it("authenticates a registered user with the correct password", async () => {
    const service = new UserService(new FakeUserRepository(), "test-secret");
    await service.register(registration);
    await expect(service.login({ email: registration.email, password: registration.password }))
      .resolves.toMatchObject({ email: registration.email });
  });

  it("returns 422 when authentication credentials are invalid", async () => {
    const service = new UserService(new FakeUserRepository(), "test-secret");
    await expect(service.login({ email: registration.email, password: "wrong" }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  it("hashes a changed password before updating the user", async () => {
    const repository = new FakeUserRepository();
    const service = new UserService(repository, "test-secret");
    await service.register(registration);
    await service.update(1, { password: "changed-password" });
    await expect(service.login({ email: registration.email, password: "changed-password" }))
      .resolves.toMatchObject({ username: registration.username });
  });
});
