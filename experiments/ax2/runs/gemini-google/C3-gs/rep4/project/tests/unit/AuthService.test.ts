import { AuthService } from '../../src/services/AuthService';
import { IUserRepository, CreateUserData, UpdateUserData } from '../../src/repositories/IUserRepository';
import { UserEntity } from '../../src/types';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../src/errors/AppError';

class FakeUserRepository implements IUserRepository {
  private users: UserEntity[] = [];

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.username === username) || null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user: UserEntity = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: data.bio ?? '',
      image: data.image ?? '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found in fake');
    if (data.email !== undefined) user.email = data.email;
    if (data.username !== undefined) user.username = data.username;
    if (data.passwordHash !== undefined) user.passwordHash = data.passwordHash;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.image !== undefined) user.image = data.image;
    user.updatedAt = new Date();
    return user;
  }
}

describe('AuthService unit tests', () => {
  let userRepo: FakeUserRepository;
  let authService: AuthService;

  beforeEach(() => {
    userRepo = new FakeUserRepository();
    authService = new AuthService(userRepo);
  });

  describe('register', () => {
    it('successfully registers a new user with token', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.bio).toBe('');
      expect(result.image).toBe('');
    });

    it('rejects registration with missing fields', async () => {
      await expect(
        authService.register({
          email: '',
          username: '',
          password: ''
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects registration with duplicate email', async () => {
      await authService.register({
        email: 'duplicate@example.com',
        username: 'user1',
        password: 'password123'
      });

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          username: 'user2',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects registration with duplicate username', async () => {
      await authService.register({
        email: 'first@example.com',
        username: 'sameuser',
        password: 'password123'
      });

      await expect(
        authService.register({
          email: 'second@example.com',
          username: 'sameuser',
          password: 'password123'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'login@example.com',
        username: 'loginuser',
        password: 'correctpassword'
      });
    });

    it('logs in successfully with correct credentials', async () => {
      const result = await authService.login({
        email: 'login@example.com',
        password: 'correctpassword'
      });

      expect(result.email).toBe('login@example.com');
      expect(result.username).toBe('loginuser');
      expect(result.token).toBeDefined();
    });

    it('rejects login with incorrect password', async () => {
      await expect(
        authService.login({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('rejects login with non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'correctpassword'
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('rejects login with blank credentials', async () => {
      await expect(
        authService.login({
          email: '',
          password: ''
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCurrentUser', () => {
    it('returns the current user by id', async () => {
      const registered = await authService.register({
        email: 'get@example.com',
        username: 'getuser',
        password: 'password123'
      });

      const userInDb = await userRepo.findByEmail('get@example.com');
      const current = await authService.getCurrentUser(userInDb!.id);

      expect(current.email).toBe('get@example.com');
      expect(current.username).toBe('getuser');
      expect(current.token).toBeDefined();
    });

    it('throws NotFoundError for non-existent user id', async () => {
      await expect(authService.getCurrentUser('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('updates user bio and image successfully', async () => {
      await authService.register({
        email: 'update@example.com',
        username: 'updateuser',
        password: 'password123'
      });
      const user = await userRepo.findByEmail('update@example.com');

      const updated = await authService.updateUser(user!.id, {
        bio: 'New bio',
        image: 'https://example.com/avatar.jpg'
      });

      expect(updated.bio).toBe('New bio');
      expect(updated.image).toBe('https://example.com/avatar.jpg');
    });

    it('updates email and username when available', async () => {
      await authService.register({
        email: 'old@example.com',
        username: 'oldname',
        password: 'password123'
      });
      const user = await userRepo.findByEmail('old@example.com');

      const updated = await authService.updateUser(user!.id, {
        email: 'new@example.com',
        username: 'newname'
      });

      expect(updated.email).toBe('new@example.com');
      expect(updated.username).toBe('newname');
    });

    it('rejects update if new email is already in use', async () => {
      await authService.register({
        email: 'first@example.com',
        username: 'first',
        password: 'password123'
      });
      await authService.register({
        email: 'second@example.com',
        username: 'second',
        password: 'password123'
      });
      const secondUser = await userRepo.findByEmail('second@example.com');

      await expect(
        authService.updateUser(secondUser!.id, {
          email: 'first@example.com'
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
