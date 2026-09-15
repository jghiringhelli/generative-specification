import { AuthService } from '../../src/auth/AuthService';
import { ValidationError } from '../../src/errors/AppError';
import { InMemoryUserRepository } from '../support/InMemoryUserRepository';
import { TestPasswordHasher, TestTokenService } from '../support/AuthTestDoubles';

describe('AuthService', () => {
  it('registers a user with a hashed password and token', async () => {
    const users = new InMemoryUserRepository();
    const service = new AuthService(users, new TestPasswordHasher(), new TestTokenService());

    const result = await service.register({
      email: 'alice@example.com',
      username: 'alice',
      password: 'password1',
    });

    expect(result).toMatchObject({
      email: 'alice@example.com',
      username: 'alice',
      token: 'token:1',
      bio: null,
      image: null,
    });
    expect((await users.findById('1'))?.passwordHash).toBe('hash:password1');
  });

  it('rejects invalid login credentials', async () => {
    const users = new InMemoryUserRepository();
    const service = new AuthService(users, new TestPasswordHasher(), new TestTokenService());
    await service.register({
      email: 'alice@example.com',
      username: 'alice',
      password: 'password1',
    });

    await expect(service.login({
      email: 'alice@example.com',
      password: 'incorrect',
    })).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates the authenticated user and rehashes a new password', async () => {
    const users = new InMemoryUserRepository();
    const service = new AuthService(users, new TestPasswordHasher(), new TestTokenService());
    await service.register({
      email: 'alice@example.com',
      username: 'alice',
      password: 'password1',
    });

    const result = await service.updateUser('1', {
      username: 'alice-updated',
      password: 'password2',
    });

    expect(result.username).toBe('alice-updated');
    expect((await users.findById('1'))?.passwordHash).toBe('hash:password2');
  });
});
