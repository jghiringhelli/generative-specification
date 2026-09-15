/**
 * Persistence port for social following relationships between users.
 */
export interface IProfileRepository {
  /**
   * Determine whether one user follows another.
   * @param followerId - The id of the potential follower.
   * @param followedId - The id of the potentially followed user.
   * @returns True if followerId follows followedId.
   */
  isFollowing(followerId: number, followedId: number): Promise<boolean>;

  /**
   * Create a follow relationship. Idempotent.
   * @param followerId - The follower's id.
   * @param followedId - The followed user's id.
   */
  follow(followerId: number, followedId: number): Promise<void>;

  /**
   * Remove a follow relationship. Idempotent.
   * @param followerId - The follower's id.
   * @param followedId - The followed user's id.
   */
  unfollow(followerId: number, followedId: number): Promise<void>;

  /**
   * List the ids of users a given user follows.
   * @param followerId - The follower's id.
   * @returns Array of followed user ids.
   */
  findFollowedIds(followerId: number): Promise<number[]>;
}
