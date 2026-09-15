/**
 * Persistence port for profile follow relationships.
 */
export interface IProfileRepository {
  /**
   * Create a follow relationship.
   * @param followerId - Id of the user who follows.
   * @param followingId - Id of the user being followed.
   */
  follow(followerId: number, followingId: number): Promise<void>;

  /**
   * Remove a follow relationship.
   * @param followerId - Id of the user who follows.
   * @param followingId - Id of the user being followed.
   */
  unfollow(followerId: number, followingId: number): Promise<void>;

  /**
   * Determine whether one user follows another.
   * @param followerId - Id of the potential follower.
   * @param followingId - Id of the potentially followed user.
   * @returns True if the follow relationship exists.
   */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;

  /**
   * List the ids of users followed by the given user.
   * @param followerId - Id of the following user.
   * @returns Ids of followed users.
   */
  findFollowingIds(followerId: number): Promise<number[]>;
}
