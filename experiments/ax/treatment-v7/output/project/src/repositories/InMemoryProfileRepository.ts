import type { UserProfile } from '../types/domain';
import type { IProfileRepository } from './IProfileRepository';
import type { IUserRepository } from './IUserRepository';
import { NotFoundError } from '../errors/AppError';

/** Minimal user record used when no shared IUserRepository is provided. */
interface StoredUser {
  id: number;
  username: string;
  bio: string | null;
  image: string | null;
}

/**
 * In-memory implementation of `IProfileRepository` for use in tests.
 *
 * Two modes:
 *   1. Standalone (no userRepo): call `seed()` to pre-populate users manually.
 *      Used in isolated unit tests where only profile behaviour is exercised.
 *   2. Shared (userRepo injected): delegates user lookups to the provided repository.
 *      Used in route-level integration tests where users are created via the API
 *      and the profile repo must reflect them without manual seeding.
 *
 * @example — standalone
 * const repo = new InMemoryProfileRepository();
 * repo.seed([{ id: 1, username: 'alice', bio: null, image: null }]);
 *
 * @example — shared user store
 * const userRepo = new InMemoryUserRepository();
 * const profileRepo = new InMemoryProfileRepository(userRepo);
 */
export class InMemoryProfileRepository implements IProfileRepository {
  private readonly internalUsers = new Map<number, StoredUser>();
  /** Set of follow pairs encoded as `${followerId}:${followingId}`. */
  private readonly follows = new Set<string>();

  constructor(private readonly userRepo?: IUserRepository) {}

  /**
   * Seed the repository with user records (standalone mode only).
   *
   * @param users - Array of user records to pre-populate
   */
  seed(users: StoredUser[]): void {
    for (const user of users) {
      this.internalUsers.set(user.id, user);
    }
  }

  /** Remove all users (from internal store) and follow relationships. */
  clear(): void {
    this.internalUsers.clear();
    this.follows.clear();
  }

  /**
   * Find a user's public profile by username.
   *
   * @param username - Target username
   * @param currentUserId - Optional viewer ID for follow status
   * @returns UserProfile or null if not found
   */
  async findByUsername(username: string, currentUserId?: number): Promise<UserProfile | null> {
    const user = await this.resolveByUsername(username);
    if (!user) return null;

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following:
        currentUserId !== undefined
          ? this.follows.has(this.followKey(currentUserId, user.id))
          : false,
    };
  }

  /**
   * Create a follow relationship by username (idempotent).
   *
   * @param followerId - ID of the following user
   * @param username - Username of the user to follow
   * @returns The followed user's profile with `following: true`
   * @throws `NotFoundError` if no user with that username exists
   */
  async follow(followerId: number, username: string): Promise<UserProfile> {
    const target = await this.resolveByUsername(username);
    if (!target) throw new NotFoundError('profile');

    this.follows.add(this.followKey(followerId, target.id));
    return { username: target.username, bio: target.bio, image: target.image, following: true };
  }

  /**
   * Remove a follow relationship by username (idempotent).
   *
   * @param followerId - ID of the user removing the follow
   * @param username - Username of the user to unfollow
   * @returns The unfollowed user's profile with `following: false`
   * @throws `NotFoundError` if no user with that username exists
   */
  async unfollow(followerId: number, username: string): Promise<UserProfile> {
    const target = await this.resolveByUsername(username);
    if (!target) throw new NotFoundError('profile');

    this.follows.delete(this.followKey(followerId, target.id));
    return { username: target.username, bio: target.bio, image: target.image, following: false };
  }

  /**
   * Resolve a user by username from either the injected repo or the internal store.
   * Returns a minimal user shape sufficient for profile operations.
   */
  private async resolveByUsername(
    username: string,
  ): Promise<StoredUser | null> {
    if (this.userRepo) {
      return this.userRepo.findByUsername(username);
    }
    return this.findInternal(username) ?? null;
  }

  /** Look up a user in the internal seed store. */
  private findInternal(username: string): StoredUser | undefined {
    return [...this.internalUsers.values()].find((u) => u.username === username);
  }

  /** Encode a follower/following pair as a stable string key. */
  private followKey(followerId: number, followingId: number): string {
    return `${followerId}:${followingId}`;
  }
}
