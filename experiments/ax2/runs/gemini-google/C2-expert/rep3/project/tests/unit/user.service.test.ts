import { NotFoundError, ValidationError } from '../../src/errors/app-error';
import { UserRepository } from '../../src/repositories/user.repository';
import { UserService } from '../../src/services/user.service';
import * as passwordUtil from '../../src/utils/password.util';

describe('UserService Unit Tests', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let userService: UserService;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      isFollowing: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    userService = new UserService(mockUserRepo);
  });

  it('registers user and returns formatted user dto', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findByUsername.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashed-password',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await userService.register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.username).toBe('testuser');
    expect(result.email).toBe('test@example.com');
    expect(result.token).toBeDefined();
  });

  it('throws ValidationError when registering with an existing email', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      username: 'existing',
      password: 'hashed',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      userService.register({
        username: 'newuser',
        email: 'test@example.com',
        password: 'password123',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when registering with an existing username', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findByUsername.mockResolvedValue({
      id: 1,
      email: 'old@example.com',
      username: 'taken_user',
      password: 'hashed',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      userService.register({
        username: 'taken_user',
        email: 'new@example.com',
        password: 'password123',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('authenticates user when credentials are valid', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({
      id: 1,
      email: 'login@example.com',
      username: 'loginuser',
      password: 'hashed-password',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(true);

    const result = await userService.login({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(result.email).toBe('login@example.com');
    expect(result.token).toBeDefined();
  });

  it('throws ValidationError when user password does not match during login', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({
      id: 1,
      email: 'login@example.com',
      username: 'loginuser',
      password: 'hashed-password',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(false);

    await expect(
      userService.login({
        email: 'login@example.com',
        password: 'wrong-password',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError when current user id does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(userService.getCurrentUser(999)).rejects.toThrow(NotFoundError);
  });
});
