/**
 * Profile repository port interface.
 * Defines data access contract for user profiles and follows.
 */
export interface IProfileRepository {
  /**
   * Get a user's profile by username.
   * @param username - Target username
   * @param currentUserId - Current user ID (optional, for follow status)
   * @returns Profile or null if user not found
   */
  findByUsername(username: string, currentUserId?: number): Promise<Profile | null>;

  /**
   * Follow a user.
   * @param followerId - ID of user who is following
   * @param followingId - ID of user being followed
   */
  follow(followerId: number, followingId: number): Promise<void>;

  /**
   * Unfollow a user.
   * @param followerId - ID of user who is unfollowing
   * @param followingId - ID of user being unfollowed
   */
  unfollow(followerId: number, followingId: number): Promise<void>;

  /**
   * Check if follower follows following.
   * @param followerId - Follower user ID
   * @param followingId - Following user ID
   * @returns True if following relationship exists
   */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
}

export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}
