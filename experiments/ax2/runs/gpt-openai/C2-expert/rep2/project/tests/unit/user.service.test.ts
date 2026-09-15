import { hashPassword } from '../../src/auth/password';
import { UserValidationError } from '../../src/users/user.errors';
import { UserRepositoryPort } from '../../src/users/user.repository';
import { UserService } from '../../src/users/user.service';
import { CreateUserData, UpdateUserData, UserRecord } from '../../src/users/user.types';

class FakeUserRepository implements UserRepositoryPort {
  public users: UserRecord[] = [];

  public async create(data: CreateUserData): Promise<UserRecord> {
    const user = { ...data, id: this.users.length + 1, bio: null, image: null, createdAt: new Date(), updatedAt: new Date() };
    this.users.push(user);
    return user;
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  public async findById(id: number): Promise<UserRecord | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  public async update(id: number, data: UpdateUserData): Promise<UserRecord> {
    const index = this.users.findIndex((user) => user.id === id);
    this.users[index] = { ...this.users[index], ...data, updatedAt: new Date() };
    return this.users[index];
  }
}

describe('user service', () => {
  test('registers a user without exposing the password', async () => {
    const service = new UserService(new FakeUserRepository(), 'secret');
    const response = await service.register('alice@example.com', 'alice', 'password');
    expect(response).not.toHaveProperty('password');
    expect(response.token).toEqual(expect.any(String));
  });

  test('rejects registration when the email already exists', async () => {
    const repository = new FakeUserRepository();
    const service = new UserService(repository, 'secret');
    await service.register('alice@example.com', 'alice', 'password');
    await expect(service.register('alice@example.com', 'alice2', 'password'))
      .rejects.toBeInstanceOf(UserValidationError);
  });

  test('logs in a user when the password is correct', async () => {
    const repository = new FakeUserRepository();
    await repository.create({ email: 'alice@example.com', username: 'alice', password: await hashPassword('password') });
    const response = await new UserService(repository, 'secret').login('alice@example.com', 'password');
    expect(response.username).toBe('alice');
  });

  test('rejects login when the password is incorrect', async () => {
    const repository = new FakeUserRepository();
    await repository.create({ email: 'alice@example.com', username: 'alice', password: await hashPassword('password') });
    await expect(new UserService(repository, 'secret').login('alice@example.com', 'wrong'))
      .rejects.toBeInstanceOf(UserValidationError);
  });

  test('updates the current user and hashes a changed password', async () => {
    const repository = new FakeUserRepository();
    const created = await repository.create({ email: 'alice@example.com', username: 'alice', password: 'old' });
    const response = await new UserService(repository, 'secret').update(created.id, { bio: 'Writer', password: 'new' });
    expect(response.bio).toBe('Writer');
    expect(repository.users[0].password).not.toBe('new');
  });
});
