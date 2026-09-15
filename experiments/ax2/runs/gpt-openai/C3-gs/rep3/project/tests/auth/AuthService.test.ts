import { AuthService } from '../../src/auth/AuthService';
import { ConflictError, UnauthorizedError } from '../../src/errors/AppError';
import { InMemoryUserRepository } from '../fixtures/InMemoryUserRepository';
import { TestPasswordHasher } from '../fixtures/TestPasswordHasher';
import { TestTokenService } from '../fixtures/TestTokenService';

function createService(): AuthService {
  return new AuthService(
    new InMemoryUserRepository(),
    new TestPasswordHasher(),
    new TestTokenService(),
  );
}

describe('AuthService', () => {
  test('registers a user without exposing its password hash', async () => {
    const service = createService();
    const user = await service.register({
      email: 'alice@example.com',
      username: 'alice',
      password: 'password123',
    });
    expect(user).toEqual({
      email: 'alice@example.com',
      username: 'alice',
      token: 'token-1',
      bio: null,
      image: null,
    });
  });

  test('rejects duplicate email addresses', async () => {
    const service = createService();
    await service.register({
      email: 'alice@example.com',
      username: 'alice',
      password: 'password123',
    });
    await expect(service.register({
      email: 'alice@example.com',
      username: 'other',
      password: 'password123',
    })).rejects.toBeInstanceOf(ConflictError);
  });

  test('rejects an incorrect login password', async () => {
    const service = createService();
    await service.register({
      email: 'alice@example.com',
      username: 'alice',
      password: 'password123',
    });
    await expect(service.login({
      email: 'alice@example.com',
      password: 'incorrect',
    })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  test('updates the authenticated user and password', async () => {
    const service = createService();
    const registered = await service.register({
      email: 'alice@example.com',
      username: 'alice',
      password: 'password123',
    });
    const updated = await service.updateUser(registered.token.slice(6), {
      username: 'alice-updated',
      password: 'new-password',
      bio: 'Writer',
    });
    expect(updated.username).toBe('alice-updated');
    await expect(service.login({
      email: 'alice@example.com',
      password: 'new-password',
    })).resolves.toMatchObject({ bio: 'Writer' });
  });
});
