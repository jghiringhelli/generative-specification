import { AuthService } from '../../src/services/AuthService';
import { InMemoryUserRepository } from '../helpers/InMemoryUserRepository';
import { FakePasswordHasher } from '../helpers/FakePasswordHasher';
import { ConflictError, UnauthorizedError, ValidationError } from '../../src/errors/AppError';

/**
 * Build a fresh AuthService with in-memory dependencies.
 */
function buildService(): {
  service: AuthService;
  users: InMemoryUserRepository;
  hasher: FakePasswordHasher;
} {
  const users = new InMemoryUserRepository();
  const hasher = new FakePasswordHasher();
  const service = new AuthService(users, hasher, 'test-secret');
  return { service, users, hasher };
}

const validRegister = {
  user: { username: 'jane', email: 'jane@example.com', password: 'secret123' }
};

describe('AuthService.register', () => {
  it('creates a user and returns a token', async () => {
    const { service } = buildService();
    const result = await service.register(validRegister);
    expect(result.user.username).toBe('jane');
    expect(result.user.email).toBe('jane@example.com');
    expect(result.user.token).toEqual(expect.any(String));
    expect(result.user.bio).toBe('');
    expect(result.user.image).toBeNull();
  });

  it('stores the hashed password, never the plaintext', async () => {
    const { service, users } = buildService();
    await service.register(validRegister);
    const stored = await users.findByEmail('jane@example.com');
    expect(stored?.passwordHash).toBe('hashed:secret123');
  });

  it('rejects a duplicate email', async () => {
    const { service } = buildService();
    await service.register(validRegister);
    await expect(
      service.register({ user: { ...validRegister.user, username: 'other' } })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a duplicate username', async () => {
    const { service } = buildService();
    await service.register(validRegister);
    await expect(
      service.register({ user: { ...validRegister.user, email: 'new@example.com' } })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a missing email', async () => {
    const { service } = buildService();
    await expect(
      service.register({ user: { username: 'jane', password: 'secret123' } })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects an invalid email format', async () => {
    const { service } = buildService();
    await expect(
      service.register({ user: { username: 'jane', email: 'nope', password: 'secret123' } })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('AuthService.login', () => {
  it('returns a token for valid credentials', async () => {
    const { service } = buildService();
    await service.register(validRegister);
    const result = await service.login({
      user: { email: 'jane@example.com', password: 'secret123' }
    });
    expect(result.user.email).toBe('jane@example.com');
    expect(result.user.token).toEqual(expect.any(String));
  });

  it('rejects an unknown email', async () => {
    const { service } = buildService();
    await expect(
      service.login({ user: { email: 'ghost@example.com', password: 'secret123' } })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a wrong password', async () => {
    const { service } = buildService();
    await service.register(validRegister);
    await expect(
      service.login({ user: { email: 'jane@example.com', password: 'wrong' } })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('AuthService.getCurrentUser', () => {
  it('returns the user with a fresh token', async () => {
    const { service, users } = buildService();
    await service.register(validRegister);
    const entity = await users.findByEmail('jane@example.com');
    const result = await service.getCurrentUser(entity!);
    expect(result.user.username).toBe('jane');
    expect(result.user.token).toEqual(expect.any(String));
  });
});

describe('AuthService.updateUser', () => {
  it('updates bio and image', async () => {
    const { service, users } = buildService();
    await service.register(validRegister);
    const entity = await users.findByEmail('jane@example.com');
    const result = await service.updateUser(entity!, {
      user: { bio: 'hello', image: 'https://example.com/a.png' }
    });
    expect(result.user.bio).toBe('hello');
    expect(result.user.image).toBe('https://example.com/a.png');
  });

  it('updates the password hash when a new password is given', async () => {
    const { service, users } = buildService();
    await service.register(validRegister);
    const entity = await users.findByEmail('jane@example.com');
    await service.updateUser(entity!, { user: { password: 'newpass' } });
    const stored = await users.findByEmail('jane@example.com');
    expect(stored?.passwordHash).toBe('hashed:newpass');
  });

  it('rejects updating email to one already taken by another user', async () => {
    const { service, users } = buildService();
    await service.register(validRegister);
    await service.register({
      user: { username: 'bob', email: 'bob@example.com', password: 'secret123' }
    });
    const jane = await users.findByEmail('jane@example.com');
    await expect(
      service.updateUser(jane!, { user: { email: 'bob@example.com' } })
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
