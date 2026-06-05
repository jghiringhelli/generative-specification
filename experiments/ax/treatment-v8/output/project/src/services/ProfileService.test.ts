/**
 * Unit tests for {@link ProfileService}.
 *
 * The service is exercised over the in-memory repository fakes (working
 * implementations, not mocks): a user repository to resolve usernames and a
 * profile repository for the follow graph. These tests pin the behaviour the
 * three profile endpoints depend on — the follow/unfollow state machine and the
 * not-found contract — independently of HTTP.
 *
 * @gs-links: docs/specs/profiles.md, docs/use-cases.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { InMemoryProfileRepository } from '../adapters/persistence/InMemoryProfileRepository.js';
import { InMemoryUserRepository } from '../adapters/persistence/InMemoryUserRepository.js';
import { NotFoundError } from '../errors/AppError.js';
import type { User } from '../repositories/IUserRepository.js';
import { ProfileService } from './ProfileService.js';

describe('ProfileService', () => {
  let users: InMemoryUserRepository;
  let follows: InMemoryProfileRepository;
  let service: ProfileService;
  let jane: User;
  let bob: User;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    follows = new InMemoryProfileRepository();
    service = new ProfileService(users, follows);
    jane = await users.create({ email: 'jane@x.com', username: 'jane', passwordHash: 'h' });
    bob = await users.create({ email: 'bob@x.com', username: 'bob', passwordHash: 'h' });
  });

  describe('getProfile', () => {
    it('returns the target profile with following=false for an anonymous viewer', async () => {
      const profile = await service.getProfile('bob');
      expect(profile).toEqual({ username: 'bob', bio: null, image: null, following: false });
    });

    it('reports following=false when the viewer does not follow the target', async () => {
      const profile = await service.getProfile('bob', jane.id);
      expect(profile.following).toBe(false);
    });

    it('reports following=true when the viewer already follows the target', async () => {
      await follows.follow(jane.id, bob.id);
      const profile = await service.getProfile('bob', jane.id);
      expect(profile.following).toBe(true);
    });

    it('throws NotFoundError for an unknown username', async () => {
      await expect(service.getProfile('ghost')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('follow', () => {
    it('creates the follow edge and returns following=true', async () => {
      const profile = await service.follow('bob', jane.id);
      expect(profile.following).toBe(true);
      expect(await follows.isFollowing(jane.id, bob.id)).toBe(true);
    });

    it('is idempotent — following twice keeps a single edge', async () => {
      await service.follow('bob', jane.id);
      await service.follow('bob', jane.id);
      expect(await follows.listFollowedIds(jane.id)).toEqual([bob.id]);
    });

    it('throws NotFoundError when the target username does not exist', async () => {
      await expect(service.follow('ghost', jane.id)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('unfollow', () => {
    it('removes the follow edge and returns following=false', async () => {
      await service.follow('bob', jane.id);
      const profile = await service.unfollow('bob', jane.id);
      expect(profile.following).toBe(false);
      expect(await follows.isFollowing(jane.id, bob.id)).toBe(false);
    });

    it('is a no-op when the viewer was not following', async () => {
      const profile = await service.unfollow('bob', jane.id);
      expect(profile.following).toBe(false);
    });

    it('throws NotFoundError when the target username does not exist', async () => {
      await expect(service.unfollow('ghost', jane.id)).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
