import { AuthService } from '../../src/services/AuthService';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from '../../src/repositories/IUserRepository';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../src/errors/AppError';

class FakeUserRepository implements IUserRepository {
  private users: UserEntity[] = [];

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return (
      this.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null
    );
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user: UserEntity = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: data.bio ?? '',
      image: data.image ?? '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    const existing = this.users[index];
    const updated: UserEntity = {
      ...existing,
      email: data.email ?? existing.email,
      username: data.username ?? existing.username,
      passwordHash: data.passwordHash ?? existing.passwordHash,
      bio: data.bio !== undefined ? data.bio : existing.bio,
      image: data.image !== undefined ? data.image : existing.image,
      updatedAt: new Date(),
    };
    this.users[index] = updated;
    return updated;
  }
}

describe('AuthService', () => {
  let fakeRepo: FakeUserRepository;
  let authService: AuthService;

  beforeEach(() => {
    fakeRepo = new FakeUserRepository();
    authService = new AuthService(fakeRepo);
  });

  describe('register', () => {
    it('successfully registers a new user and returns a token', async () => {
      const user = await authService.register({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(user.username).toBe('alice');
      expect(user.email).toBe('alice@example.com');
      expect(user.token).toBeDefined();
      expect(typeof user.token).toBe('string');
    });

    it('rejects duplicate email with ConflictError', async () => {
      await authService.register({
        username: 'alice1',
        email: 'alice@example.com',
        password: 'password123',
      });

      await expect(
        authService.register({
          username: 'alice2',
          email: 'alice@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('rejects duplicate username with ConflictError', async () => {
      await authService.register({
        username: 'alice',
        email: 'alice1@example.com',
        password: 'password123',
      });

      await expect(
        authService.register({
          username: 'alice',
          email: 'alice2@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        username: 'bob',
        email: 'bob@example.com',
        password: 'securepassword',
      });
    });

    it('successfully authenticates valid credentials', async () => {
      const res = await authService.login({
        email: 'bob@example.com',
        password: 'securepassword',
      });

      expect(res.email).toBe('bob@example.com');
      expect(res.username).toBe('bob');
      expect(res.token).toBeDefined();
    });

    it('throws UnauthorizedError for non-existent email', async () => {
      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'securepassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError for incorrect password', async () => {
      await expect(
        authService.login({
          email: 'bob@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUser', () => {
    it('returns the user data by ID', async () => {
      const created = await authService.register({
        username: 'carol',
        email: 'carol@example.com',
        password: 'password123',
      });

      const found = await fakeRepo.findByEmail('carol@example.com');
      const current = await authService.getCurrentUser(found!.id);

      expect(current.email).toBe(created.email);
      expect(current.username).toBe(created.username);
    });

    it('throws NotFoundError when user does not exist', async () => {
      await expect(authService.getCurrentUser('non-existent-id')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateUser', () => {
    it('updates user bio and image successfully', async () => {
      await authService.register({
        username: 'dave',
        email: 'dave@example.com',
        password: 'password123',
      });

      const user = await fakeRepo.findByEmail('dave@example.com');
      const updated = await authService.updateUser(user!.id, {
        bio: 'New bio',
        image: 'https://example.com/avatar.jpg',
      });

      expect(updated.bio).toBe('New bio');
      expect(updated.image).toBe('https://example.com/avatar.jpg');
    });

    it('throws ConflictError if updating to already taken email', async () => {
      await authService.register({
        username: 'user1',
        email: 'u1@example.com',
        password: 'password123',
      });
      await authService.register({
        username: 'user2',
        email: 'u2@example.com',
        password: 'password123',
      });

      const user2 = await fakeRepo.findByEmail('u2@example.com');
      await expect(
        authService.updateUser(user2!.id, {
          email: 'u1@example.com',
        })
      ).rejects.toThrow(ConflictError);
    });
  });
});
