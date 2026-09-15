import { User } from '@prisma/client';

export interface ProfileUserData {
  readonly id: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

/**
 * Persistence contract for profile and social follow relationships.
 */
export interface IProfileRepository {
  /**
   * Finds a user by their username.
   *
   * @param {string} username - Target username
   * @returns {Promise<ProfileUserData | null>} User data or null
   */
  findByUsername(username: string): Promise<ProfileUserData | null>;

  /**
   * Checks whether a user follows another user.
   *
   * @param {string} followerId - ID of follower
   * @param {string} followingId - ID of target user being followed
   * @returns {Promise<boolean>} True if following exists, false otherwise
   */
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Creates a follow relationship (idempotent).
   *
   * @param {string} followerId - ID of follower
   * @param {string} followingId - ID of target user
   * @returns {Promise<void>}
   */
  follow(followerId: string, followingId: string): Promise<void>;

  /**
   * Removes a follow relationship (idempotent).
   *
   * @param {string} followerId - ID of follower
   * @param {string} followingId - ID of target user
   * @returns {Promise<void>}
   */
  unfollow(followerId: string, followingId: string): Promise<void>;
}
