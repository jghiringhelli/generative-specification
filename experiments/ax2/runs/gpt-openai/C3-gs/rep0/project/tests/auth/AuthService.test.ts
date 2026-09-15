import argon2 from 'argon2';
import { AuthService } from '../../src/auth/AuthService';
import { IUserRepository, UserRecord } from '../../src/repositories/IUserRepository';

const user: UserRecord = {
  id: 'user-1',
  email: 'alice@example.com',
  username: 'alice',
  passwordHash: '',
  bio: null,
  image: null,
};

function repository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
}

describe('AuthService', () => {
  test('registers a user with a hashed password', async () => {
    const users = repository();
    users.create.mockImplementation(async (input) => ({ ...user, ...input }));
    const service = new AuthService(users, 'a-secret-with-at-least-thirty-two-characters');
    const result = await service.register({
      email: user.email, username: user.username, password: 'password123',
    });
    expect(result.username).toBe('alice');
    expect(await argon2.verify(users.create.mock.calls[0]![0].passwordHash, 'password123')).toBe(true);
  });

  test('rejects an invalid password', async () => {
    const users = repository();
    users.findByEmail.mockResolvedValue({ ...user, passwordHash: await argon2.hash('correct123') });
    const service = new AuthService(users, 'a-secret-with-at-least-thirty-two-characters');
    await expect(service.login(user.email, 'incorrect')).rejects.toMatchObject({ statusCode: 401 });
  });
});
