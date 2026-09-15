import { AuthService } from '../../src/services/AuthService';
import { ConflictError, UnauthorizedError, ValidationError } from '../../src/errors/AppError';
import { InMemoryStore, InMemoryUserRepository } from '../helpers/userFakes';

/**
 * Build an AuthService backed by a fresh in-memory user repository.
 * @returns The service and its store.
 */
function buildService(): { service: AuthService; store: InMemoryStore } {
  const store = new InMemoryStore();
  const service = new AuthService(new InMemoryUserRepository(store));
  return { service, store };
}

const validRegistration = {
  user: { username: 'alice', email: 'alice@example.com', password: 'password123' },
};

describe('AuthService.register', () => {
  it('creates a user and returns a token', async () => {
    const { service, store } = buildService();
    const result = await service.register(validRegistration);
    expect(result.user.username).toBe('alice');
    expect(result.token).toEqual(expect.any(String));
    expect(store.users).toHaveLength(1);
  });

  it('hashes the password rather than storing plaintext', async () => {
    const { service } = buildService();
    const result = await service.register(validRegistration);
    expect(result.user.passwordHash).not.toBe('password123');
  });

  it('rejects a duplicate email with ConflictError', async () => {
    const { service } = buildService();
    await service.register(validRegistration);
    await expect(
      service.register({ user: { ...validRegistration.user, username: 'other' } }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a duplicate username with ConflictError', async () => {
    const { service } = buildService();
    await service.register(validRegistration);
    await expect(
      service.register({ user: { ...validRegistration.user, email: 'new@example.com' } }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a short password with ValidationError', async () => {
    const { service } = buildService();
    await expect(
      service.register({ user: { username: 'a', email: 'a@b.com', password: 'short' } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects an invalid email with ValidationError', async () => {
    const { service } = buildService();
    await expect(
      service.register({ user: { username: 'a', email: 'not-email', password: 'password123' } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('AuthService.login', () => {
  it('authenticates with correct credentials', async () => {
    const { service } = buildService();
    await service.register(validRegistration);
    const result = await service.login({
      user: { email: 'alice@example.com', password: 'password123' },
    });
    expect(result.user.email).toBe('alice@example.com');
    expect(result.token).toEqual(expect.any(String));
  });

  it('rejects an unknown email with UnauthorizedError', async () => {
    const { service } = buildService();
    await expect(
      service.login({ user: { email: 'ghost@example.com', password: 'password123' } }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a wrong password with UnauthorizedError', async () => {
    const { service } = buildService();
    await service.register(validRegistration);
    await expect(
      service.login({ user: { email: 'alice@example.com', password: 'wrongpassword' } }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('AuthService.updateUser', () => {
  it('updates mutable fields', async () => {
    const { service } = buildService();
    const created = await service.register(validRegistration);
    const updated = await service.updateUser(created.user.id, {
      user: { bio: 'hello', email: 'alice2@example.com' },
    });
    expect(updated.user.bio).toBe('hello');
    expect(updated.user.email).toBe('alice2@example.com');
  });

  it('rejects an email already taken by another user', async () => {
    const { service } = buildService();
    const alice = await service.register(validRegistration);
    await service.register({ user: { username: 'bob', email: 'bob@example.com', password: 'password123' } });
    await expect(
      service.updateUser(alice.user.id, { user: { email: 'bob@example.com' } }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('AuthService.getCurrentUser', () => {
  it('returns the user for a valid id', async () => {
    const { service } = buildService();
    const created = await service.register(validRegistration);
    const current = await service.getCurrentUser(created.user.id);
    expect(current.user.username).toBe('alice');
  });

  it('throws UnauthorizedError for an unknown id', async () => {
    const { service } = buildService();
    await expect(service.getCurrentUser(999)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
