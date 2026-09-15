import type { IPasswordHasher } from '../auth/IPasswordHasher';
import type { ITokenService, TokenPayload } from '../auth/ITokenService';
import type {
  CreateUserRecord,
  IUserRepository,
  UpdateUserRecord,
  UserRecord,
} from '../repositories/IUserRepository';
import { AuthService } from './AuthService';

class FakeUserRepository implements IUserRepository {
  public readonly records = new Map<string, UserRecord>();

  public findById(id: string): Promise<UserRecord | null> {
    return Promise.resolve(this.records.get(id) ?? null);
  }
  public findByEmail(email: string): Promise<UserRecord | null> {
    return Promise.resolve([...this.records.values()].find((user) => user.email === email) ?? null);
  }
  public findByUsername(username: string): Promise<UserRecord | null> {
    return Promise.resolve([...this.records.values()].find((user) => user.username === username) ?? null);
  }
  public create(data: CreateUserRecord): Promise<UserRecord> {
    const user = { id: 'user-1', bio: null, image: null, ...data };
    this.records.set(user.id, user);
    return Promise.resolve(user);
  }
  public update(id: string, data: UpdateUserRecord): Promise<UserRecord> {
    const current = this.records.get(id)!;
    const user = { ...current, ...data } as UserRecord;
    this.records.set(id, user);
    return Promise.resolve(user);
  }
}

class StubPasswordHasher implements IPasswordHasher {
  public hash(password: string): Promise<string> { return Promise.resolve(`hash:${password}`); }
  public verify(hash: string, password: string): Promise<boolean> {
    return Promise.resolve(hash === `hash:${password}`);
  }
}

class StubTokenService implements ITokenService {
  public sign(payload: TokenPayload): string { return `token:${payload.userId}`; }
  public verify(token: string): TokenPayload { return { userId: token.replace('token:', '') }; }
}

describe('AuthService', () => {
  const createService = () => {
    const users = new FakeUserRepository();
    return { users, service: new AuthService(users, new StubPasswordHasher(), new StubTokenService()) };
  };

  test('register hashes the password and returns an authenticated user', async () => {
    const { users, service } = createService();
    const result = await service.register({ email: 'a@example.com', username: 'alice', password: 'password' });
    expect(result).toEqual({ email: 'a@example.com', username: 'alice', bio: null, image: null, token: 'token:user-1' });
    expect((await users.findById('user-1'))?.passwordHash).toBe('hash:password');
  });

  test('login rejects an invalid password', async () => {
    const { service } = createService();
    await service.register({ email: 'a@example.com', username: 'alice', password: 'password' });
    await expect(service.login({ email: 'a@example.com', password: 'wrong' })).rejects.toMatchObject({ statusCode: 401 });
  });

  test('update hashes a replacement password', async () => {
    const { users, service } = createService();
    await service.register({ email: 'a@example.com', username: 'alice', password: 'password' });
    await service.updateUser('user-1', { password: 'replacement', bio: 'Writer' });
    expect((await users.findById('user-1'))).toMatchObject({ passwordHash: 'hash:replacement', bio: 'Writer' });
  });
});
