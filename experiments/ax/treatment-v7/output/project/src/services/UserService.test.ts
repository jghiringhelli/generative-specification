import { UserService } from './UserService';
import { InMemoryUserRepository } from '../repositories/InMemoryUserRepository';
import { ConflictError, AppError, NotFoundError } from '../errors/AppError';

const TEST_EMAIL = 'alice@example.com';
const TEST_USERNAME = 'alice';
const TEST_PASSWORD = 'password123';

describe('UserService', () => {
  let repo: InMemoryUserRepository;
  let service: UserService;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    service = new UserService(repo);
  });

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------
  describe('register', () => {
    it('returns authenticated user response on successful registration', async () => {
      const result = await service.register({
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      });

      expect(result.email).toBe(TEST_EMAIL);
      expect(result.username).toBe(TEST_USERNAME);
      expect(result.bio).toBeNull();
      expect(result.image).toBeNull();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
    });

    it('stores email as lowercase', async () => {
      const result = await service.register({
        email: 'Alice@Example.COM',
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      });
      expect(result.email).toBe('alice@example.com');
    });

    it('throws ConflictError when email is already registered', async () => {
      await service.register({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD });

      await expect(
        service.register({ email: TEST_EMAIL, username: 'bob', password: TEST_PASSWORD }),
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when username is already taken', async () => {
      await service.register({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD });

      await expect(
        service.register({ email: 'bob@example.com', username: TEST_USERNAME, password: TEST_PASSWORD }),
      ).rejects.toThrow(ConflictError);
    });

    it('does not store plaintext password', async () => {
      await service.register({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD });
      const stored = await repo.findByEmail(TEST_EMAIL);
      expect(stored?.passwordHash).not.toBe(TEST_PASSWORD);
      expect(stored?.passwordHash).toMatch(/^\$argon2/);
    });
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  describe('login', () => {
    beforeEach(async () => {
      await service.register({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD });
    });

    it('returns authenticated user response for valid credentials', async () => {
      const result = await service.login({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(result.email).toBe(TEST_EMAIL);
      expect(result.username).toBe(TEST_USERNAME);
      expect(typeof result.token).toBe('string');
    });

    it('throws AppError (401) for unknown email', async () => {
      await expect(
        service.login({ email: 'unknown@example.com', password: TEST_PASSWORD }),
      ).rejects.toThrow(AppError);
    });

    it('throws AppError (401) for wrong password', async () => {
      await expect(
        service.login({ email: TEST_EMAIL, password: 'wrong-password' }),
      ).rejects.toThrow(AppError);
    });

    it('returns 401 with credentials key for invalid login', async () => {
      await expect(
        service.login({ email: TEST_EMAIL, password: 'wrong-password' }),
      ).rejects.toMatchObject({ statusCode: 401, resource: 'credentials', message: 'invalid' });
    });
  });

  // ---------------------------------------------------------------------------
  // getCurrentUser
  // ---------------------------------------------------------------------------
  describe('getCurrentUser', () => {
    it('returns authenticated response for existing user', async () => {
      const registered = await service.register({
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      });
      const stored = await repo.findByEmail(TEST_EMAIL);
      const result = await service.getCurrentUser(stored!.id);

      expect(result.email).toBe(registered.email);
      expect(result.username).toBe(registered.username);
      expect(typeof result.token).toBe('string');
    });

    it('throws NotFoundError for non-existent user id', async () => {
      await expect(service.getCurrentUser(9999)).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------------------
  // updateUser
  // ---------------------------------------------------------------------------
  describe('updateUser', () => {
    let userId: number;

    beforeEach(async () => {
      await service.register({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD });
      const stored = await repo.findByEmail(TEST_EMAIL);
      userId = stored!.id;
    });

    it('updates email and returns updated response', async () => {
      const result = await service.updateUser(userId, { email: 'newalice@example.com' });
      expect(result.email).toBe('newalice@example.com');
    });

    it('coerces empty string bio to null (§10 nullable field coercion)', async () => {
      const result = await service.updateUser(userId, { bio: '' });
      expect(result.bio).toBeNull();
    });

    it('coerces empty string image to null (§10 nullable field coercion)', async () => {
      const result = await service.updateUser(userId, { image: '' });
      expect(result.image).toBeNull();
    });

    it('stores non-empty bio string as-is', async () => {
      const result = await service.updateUser(userId, { bio: 'I write code.' });
      expect(result.bio).toBe('I write code.');
    });

    it('throws ConflictError when new email is already taken', async () => {
      await service.register({ email: 'bob@example.com', username: 'bob', password: TEST_PASSWORD });
      await expect(
        service.updateUser(userId, { email: 'bob@example.com' }),
      ).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError for non-existent user id', async () => {
      await expect(service.updateUser(9999, { bio: 'hello' })).rejects.toThrow(NotFoundError);
    });
  });
});
