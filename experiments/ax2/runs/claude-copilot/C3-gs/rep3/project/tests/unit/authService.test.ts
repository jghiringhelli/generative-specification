import { AuthService } from '../../src/services/AuthService';
import { AppConfig } from '../../src/config/config';
import { InMemoryUserRepository } from '../fixtures/inMemoryRepositories';
import { UnauthorizedError, ValidationError } from '../../src/errors/AppError';

const config: AppConfig = {
  port: 0,
  jwtSecret: 'unit-secret',
  jwtExpiry: '1h',
  nodeEnv: 'test',
};

function buildService(): { service: AuthService; users: InMemoryUserRepository } {
  const users = new InMemoryUserRepository();
  return { service: new AuthService(users, config), users };
}

describe('AuthService', () => {
  it('registers a user and issues a token', async () => {
    const { service } = buildService();
    const result = await service.register({
      user: { username: 'nina', email: 'nina@example.com', password: 'pw12345' },
    });
    expect(result.user.username).toBe('nina');
    expect(result.user.token).toBeTruthy();
  });

  it('rejects a duplicate username with ValidationError', async () => {
    const { service } = buildService();
    await service.register({
      user: { username: 'dup', email: 'a@example.com', password: 'pw12345' },
    });
    await expect(
      service.register({
        user: { username: 'dup', email: 'b@example.com', password: 'pw12345' },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('logs in with correct credentials', async () => {
    const { service } = buildService();
    await service.register({
      user: { username: 'log', email: 'log@example.com', password: 'pw12345' },
    });
    const result = await service.login({
      user: { email: 'log@example.com', password: 'pw12345' },
    });
    expect(result.user.email).toBe('log@example.com');
  });

  it('rejects login for an unknown email', async () => {
    const { service } = buildService();
    await expect(
      service.login({ user: { email: 'no@example.com', password: 'x' } }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects login with a wrong password', async () => {
    const { service } = buildService();
    await service.register({
      user: { username: 'pw', email: 'pw@example.com', password: 'correct1' },
    });
    await expect(
      service.login({ user: { email: 'pw@example.com', password: 'wrong' } }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('updates the current user', async () => {
    const { service } = buildService();
    const reg = await service.register({
      user: { username: 'upd', email: 'upd@example.com', password: 'pw12345' },
    });
    const decoded = JSON.parse(
      Buffer.from(reg.user.token.split('.')[1], 'base64').toString(),
    );
    const updated = await service.updateUser(decoded.id, {
      user: { bio: 'new bio' },
    });
    expect(updated.user.bio).toBe('new bio');
  });

  it('rejects updating to an email already taken', async () => {
    const { service } = buildService();
    await service.register({
      user: { username: 'x1', email: 'taken@example.com', password: 'pw12345' },
    });
    const reg = await service.register({
      user: { username: 'x2', email: 'free@example.com', password: 'pw12345' },
    });
    const decoded = JSON.parse(
      Buffer.from(reg.user.token.split('.')[1], 'base64').toString(),
    );
    await expect(
      service.updateUser(decoded.id, {
        user: { email: 'taken@example.com' },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
