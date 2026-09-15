import { AuthService } from '../../src/services/AuthService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { ConflictError, UnauthorizedError } from '../../src/errors/AppError';
import { verifyToken } from '../../src/utils/token';

const config = { jwtSecret: 'unit-secret', jwtExpiry: '1h' as const };

/**
 * Build an AuthService backed by a fresh in-memory user repository.
 * @returns The service and its repository.
 */
function makeService(): { service: AuthService; users: InMemoryUserRepository } {
  const users = new InMemoryUserRepository();
  return { service: new AuthService(users, config), users };
}

describe('AuthService', () => {
  it('registers a user and returns a verifiable token', async () => {
    const { service } = makeService();

    const result = await service.register({
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    expect(result.username).toBe('alice');
    expect(result.email).toBe('alice@example.com');
    expect(verifyToken(result.token, config.jwtSecret).userId).toBeGreaterThan(0);
  });

  it('stores a hashed password, never the plaintext', async () => {
    const { service, users } = makeService();

    await service.register({
      username: 'bob',
      email: 'bob@example.com',
      password: 'plaintext',
    });

    const stored = await users.findByEmail('bob@example.com');
    expect(stored?.passwordHash).toBeDefined();
    expect(stored?.passwordHash).not.toBe('plaintext');
  });

  it('rejects duplicate email registration', async () => {
    const { service } = makeService();
    await service.register({ username: 'a', email: 'dup@example.com', password: 'x' });

    await expect(
      service.register({ username: 'b', email: 'dup@example.com', password: 'y' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects duplicate username registration', async () => {
    const { service } = makeService();
    await service.register({ username: 'same', email: 'a@example.com', password: 'x' });

    await expect(
      service.register({ username: 'same', email: 'b@example.com', password: 'y' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('logs in with correct credentials', async () => {
    const { service } = makeService();
    await service.register({ username: 'carol', email: 'carol@example.com', password: 'pw' });

    const result = await service.login({ email: 'carol@example.com', password: 'pw' });
    expect(result.username).toBe('carol');
  });

  it('rejects login with wrong password', async () => {
    const { service } = makeService();
    await service.register({ username: 'dave', email: 'dave@example.com', password: 'right' });

    await expect(
      service.login({ email: 'dave@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects login for unknown email', async () => {
    const { service } = makeService();

    await expect(
      service.login({ email: 'nobody@example.com', password: 'pw' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('returns the current user', async () => {
    const { service } = makeService();
    const registered = await service.register({
      username: 'erin',
      email: 'erin@example.com',
      password: 'pw',
    });
    const userId = verifyToken(registered.token, config.jwtSecret).userId;

    const current = await service.getCurrentUser(userId);
    expect(current.email).toBe('erin@example.com');
  });

  it('updates the current user bio and email', async () => {
    const { service } = makeService();
    const registered = await service.register({
      username: 'frank',
      email: 'frank@example.com',
      password: 'pw',
    });
    const userId = verifyToken(registered.token, config.jwtSecret).userId;

    const updated = await service.updateUser(userId, {
      bio: 'Hello world',
      email: 'frank2@example.com',
    });

    expect(updated.bio).toBe('Hello world');
    expect(updated.email).toBe('frank2@example.com');
  });

  it('rejects updating email to one taken by another user', async () => {
    const { service } = makeService();
    await service.register({ username: 'g1', email: 'taken@example.com', password: 'pw' });
    const second = await service.register({
      username: 'g2',
      email: 'free@example.com',
      password: 'pw',
    });
    const userId = verifyToken(second.token, config.jwtSecret).userId;

    await expect(
      service.updateUser(userId, { email: 'taken@example.com' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
