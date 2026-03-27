import type { UserProfile } from '../types/domain';

/**
 * Port interface for user profile and follow relationship operations.
 *
 * This interface is owned by the domain/service layer.
 * Implementations:
 *   - `PrismaProfileRepository` — production (driven adapter using Prisma + PostgreSQL)
 *   - `InMemoryProfileRepository` — test doubles (fast, no database required)
 *
 * Services depend on this interface, never on concrete implementations.
 * Inject implementations at the composition root.
 *
 * Follow/unfollow accept the target username so that the repository layer
 * (which owns database access) handles the username-to-ID resolution.
 * The caller (service) works only with names it received from the API boundary.
 */
export interface IProfileRepository {
  /**
   * Find a user's public profile by username.
   *
   * @param username - The target user's username (case-sensitive).
   * @param currentUserId - Optional authenticated viewer ID for `following` computation.
   *   When omitted, `following` is always false.
   * @returns The user's public profile, or null if no user with that username exists.
   */
  findByUsername(username: string, currentUserId?: number): Promise<UserProfile | null>;

  /**
   * Create a follow relationship: follower → target username.
   *
   * Idempotent: calling when the relationship already exists does not throw.
   *
   * @param followerId - The ID of the user initiating the follow action.
   * @param username - The username of the user to follow.
   * @returns The followed user's profile with `following: true`.
   * @throws `NotFoundError` — if no user with that username exists.
   */
  follow(followerId: number, username: string): Promise<UserProfile>;

  /**
   * Remove a follow relationship: follower no longer follows target username.
   *
   * Idempotent: calling when no relationship exists does not throw.
   *
   * @param followerId - The ID of the user removing the follow.
   * @param username - The username of the user to unfollow.
   * @returns The unfollowed user's profile with `following: false`.
   * @throws `NotFoundError` — if no user with that username exists.
   */
  unfollow(followerId: number, username: string): Promise<UserProfile>;
}
