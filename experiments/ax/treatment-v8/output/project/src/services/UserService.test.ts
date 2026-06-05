/**
 * Unit specs for UserService. Sociable unit tests: the real in-memory
 * repository fake plus lightweight hasher/token stubs, so the orchestration
 * logic (uniqueness, credential checks, partial update, collision detection) is
 * exercised against a working persistence contract without crypto cost.
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors/AppError.js';
import { InMemoryUserRepository } from '../adapters/persistence/InMemoryUserRepository.js';
import type { IPasswordHasher } from './ports/IPasswordHasher.js';
import type { ITokenService, TokenPayload } from './ports/ITokenService.js';
import { UserService } from './UserService.js';

/** Reversible "hash" so the stub can verify without real crypto. */
const stubHasher: IPasswordHasher = {
  hash: (plain) => Promise.resolve(`hashed:${plain}`),
  verify: (hash, plain) => Promise.resolve(hash === `hashed:${plain}`),
};

const stubTokens: ITokenService = {
  sign: (payload: TokenPayload) => `token:${payload.userId}`,
  verify: (token: string) => ({ userId: token.replace('token:', '') }),
};

const newUser = { email: 'jane@example.com', username: 'jane', password: 'password123' };

describe('UserService', () => {
  let users: InMemoryUserRepository;
  let service: UserService;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    service = new UserService(users, stubHasher, stubTokens);
  });

  describe('register', () => {
    it('creates a user, hashes the password, and returns a token', async () => {
      const { user, token } = await service.register(newUser);
      expect(user.email).toBe('jane@example.com');
      expect(user.passwordHash).toBe('hashed:password123');
      expect(token).toBe(`token:${user.id}`);
    });

    it('rejects a duplicate email', async () => {
      await service.register(newUser);
      await expect(service.register({ ...newUser, username: 'other' })).rejects.toThrow(
        ConflictError,
      );
    });

    it('rejects a duplicate username', async () => {
      await service.register(newUser);
      await expect(
        service.register({ ...newUser, email: 'other@example.com' }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register(newUser);
    });

    it('authenticates with correct credentials', async () => {
      const { user } = await service.login({ email: newUser.email, password: newUser.password });
      expect(user.email).toBe(newUser.email);
    });

    it('rejects an unknown email', async () => {
      await expect(
        service.login({ email: 'nobody@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('rejects a wrong password', async () => {
      await expect(
        service.login({ email: newUser.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUser', () => {
    it('returns the user for a known id', async () => {
      const { user } = await service.register(newUser);
      const current = await service.getCurrentUser(user.id);
      expect(current.user.id).toBe(user.id);
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.getCurrentUser('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('applies a partial update to bio and email', async () => {
      const { user } = await service.register(newUser);
      const { user: updated } = await service.updateUser(user.id, {
        email: 'new@example.com',
        bio: 'hello',
      });
      expect(updated.email).toBe('new@example.com');
      expect(updated.bio).toBe('hello');
      expect(updated.username).toBe('jane');
    });

    it('applies a partial update to username and image', async () => {
      const { user } = await service.register(newUser);
      const { user: updated } = await service.updateUser(user.id, {
        username: 'jane-doe',
        image: 'https://example.com/avatar.png',
      });
      expect(updated.username).toBe('jane-doe');
      expect(updated.image).toBe('https://example.com/avatar.png');
      expect(updated.email).toBe(newUser.email);
    });

    it('re-hashes a changed password', async () => {
      const { user } = await service.register(newUser);
      const { user: updated } = await service.updateUser(user.id, { password: 'brand-new-pass' });
      expect(updated.passwordHash).toBe('hashed:brand-new-pass');
    });

    it('allows setting email to its current value (no false collision)', async () => {
      const { user } = await service.register(newUser);
      const { user: updated } = await service.updateUser(user.id, { email: newUser.email });
      expect(updated.email).toBe(newUser.email);
    });

    it('rejects changing email to one already taken by another user', async () => {
      const { user } = await service.register(newUser);
      await service.register({ email: 'taken@example.com', username: 'bob', password: 'password123' });
      await expect(
        service.updateUser(user.id, { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects changing username to one already taken by another user', async () => {
      const { user } = await service.register(newUser);
      await service.register({ email: 'bob@example.com', username: 'bob', password: 'password123' });
      await expect(service.updateUser(user.id, { username: 'bob' })).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError when the user does not exist', async () => {
      await expect(service.updateUser('missing', { bio: 'x' })).rejects.toThrow(NotFoundError);
    });
  });
});
