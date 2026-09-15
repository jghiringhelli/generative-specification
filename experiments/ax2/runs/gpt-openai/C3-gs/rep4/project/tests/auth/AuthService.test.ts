import type { User } from '@prisma/client';
import { AuthService } from '../../src/auth/AuthService';
import type { IPasswordHasher } from '../../src/auth/PasswordHasher';
import type { ITokenService } from '../../src/auth/JwtTokenService';
import { ConflictError, UnauthorizedError } from '../../src/errors/AppError';
import type {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
} from '../../src/repositories/IUserRepository';
import { UserBuilder } from '../builders/UserBuilder';

class UserRepositoryFake implements IUserRepository {
  public users: User[] = [];

  public async create(data: CreateUserData): Promise<User> {
    const user = new UserBuilder().with({ id: 'created', ...data }).build();
    this.users.push(user);
    return user;
  }

  public async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  public async findByUsername(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  public async update(id: string, data: UpdateUserData): Promise<User> {
    const index = this.users.findIndex((user) => user.id === id);
    this.users[index] = { ...this.users[index], ...data, updatedAt: new Date() };
    return this.users[index];
  }
}

const passwords: IPasswordHasher = {
  hash: async (password) => `hash:${password}`,
  verify: async (hash, password) => hash === `hash:${password}`,
};
const tokens: ITokenService = {
  create: (userId) => `token:${userId}`,
  read: (token) => token.replace('token:', ''),
};

describe('AuthService', () => {
  let users: UserRepositoryFake;
  let service: AuthService;

  beforeEach(() => {
    users = new UserRepositoryFake();
    service = new AuthService(users, passwords, tokens);
  });

  it('registers a user with a hashed password', async () => {
    const result = await service.register({
      email: 'new@example.com',
      username: 'new-user',
      password: 'password123',
    });
    expect(users.users[0].passwordHash).toBe('hash:password123');
    expect(result.token).toBe('token:created');
  });

  it('rejects a duplicate email', async () => {
    users.users.push(new UserBuilder().build());
    await expect(service.register({
      email: 'alice@example.com',
      username: 'different',
      password: 'password123',
    })).rejects.toBeInstanceOf(ConflictError);
  });

  it('authenticates valid credentials', async () => {
    users.users.push(new UserBuilder().with({ passwordHash: 'hash:secret' }).build());
    await expect(service.login({
      email: 'alice@example.com',
      password: 'secret',
    })).resolves.toMatchObject({ username: 'alice' });
  });

  it('rejects invalid credentials', async () => {
    await expect(service.login({
      email: 'missing@example.com',
      password: 'wrong',
    })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('updates the current user and rehashes a new password', async () => {
    users.users.push(new UserBuilder().build());
    const result = await service.updateCurrentUser('user-1', {
      bio: 'Writer',
      password: 'replacement',
    });
    expect(result.bio).toBe('Writer');
    expect(users.users[0].passwordHash).toBe('hash:replacement');
  });
});
