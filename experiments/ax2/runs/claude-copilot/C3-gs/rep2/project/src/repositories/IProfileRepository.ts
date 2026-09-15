/**
 * Persistence port for the follow relationship between users. Profile
 * projection (bio/image/following) is composed in the service layer from the
 * user and this relationship.
 */
export interface IProfileRepository {
  /**
   * Create a follow relationship.
   * @param followerId - The user who follows.
   * @param followingId - The user being followed.
   */
  follow(followerId: number, followingId: number): Promise<void>;

  /**
   * Remove a follow relationship.
   * @param followerId - The user who unfollows.
   * @param followingId - The user being unfollowed.
   */
  unfollow(followerId: number, followingId: number): Promise<void>;

  /**
   * Whether the follower currently follows the target user.
   * @param followerId - The potential follower.
   * @param followingId - The potentially followed user.
   */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
}
