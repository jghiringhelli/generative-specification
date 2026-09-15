import { AuthService } from '../../src/services/AuthService';
import { JwtTokenService } from '../../src/services/adapters/JwtTokenService';
import { InMemoryStore, InMemoryUserRepository } from '../helpers/inMemory';
import { FakePasswordHasher } from '../helpers/testApp';
import { ConflictError, UnauthorizedError, ValidationError } from '../../src/errors/AppError';

function makeService() {
  const store = new InMemoryStore();
  const users = new InMemoryUserRepository(store);
  const tokens = new JwtTokenService('secret', '7d');
  return { service: new AuthService(users, new FakePasswordHasher(), tokens), tokens };
}

describe('AuthService', () => {
  it('registers a user and issues a verifiable token', async () => {
    const { service, tokens } = makeService();
    const result = await service.register({
      username: 'ann',
      email: 'ann@example.com',
      password: 'pw',
    });
    expect(result.user.username).toBe('ann');
    expect(tokens.verify(result.user.token)).toBeTruthy();
  });

  it('rejects a duplicate email', async () => {
    const { service } = makeService();
    await service.register({ username: 'ann', email: 'a@e.com', password: 'pw' });
    await expect(
      service.register({ username: 'bob', email: 'a@e.com', password: 'pw' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a duplicate username', async () => {
    const { service } = makeService();
    await service.register({ username: 'ann', email: 'a@e.com', password: 'pw' });
    await expect(
      service.register({ username: 'ann', email: 'b@e.com', password: 'pw' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('logs in with valid credentials', async () => {
    const { service } = makeService();
    await service.register({ username: 'ann', email: 'a@e.com', password: 'pw' });
    const result = await service.login({ email: 'a@e.com', password: 'pw' });
    expect(result.user.email).toBe('a@e.com');
  });

  it('rejects login with an unknown email', async () => {
    const { service } = makeService();
    await expect(
      service.login({ email: 'ghost@e.com', password: 'pw' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects login with a wrong password', async () => {
    const { service } = makeService();
    await service.register({ username: 'ann', email: 'a@e.com', password: 'pw' });
    await expect(
      service.login({ email: 'a@e.com', password: 'nope' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('updates bio and image', async () => {
    const { service, tokens } = makeService();
    const reg = await service.register({ username: 'ann', email: 'a@e.com', password: 'pw' });
    const userId = tokens.verify(reg.user.token);
    const updated = await service.updateUser(userId, { bio: 'hi', image: 'img' });
    expect(updated.user.bio).toBe('hi');
    expect(updated.user.image).toBe('img');
  });

  it('rejects updating email to one already taken', async () => {
    const { service, tokens } = makeService();
    await service.register({ username: 'ann', email: 'a@e.com', password: 'pw' });
    const reg = await service.register({ username: 'bob', email: 'b@e.com', password: 'pw' });
    const userId = tokens.verify(reg.user.token);
    await expect(
      service.updateUser(userId, { email: 'a@e.com' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
