
/**
 * Profile repository interface.
 * Defines the contract for profile-related data access operations.
 * Note: Profiles are derived from User records; this is a read-only view interface.
 */

export interface IProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface IProfileRepository {
  /**
   * Get user profile by username.
   * @param username - Target user's username
   * @param currentUserId - ID of user viewing the profile (null if anonymous)
   * @returns Profile if user exists, null otherwise
   */
  getByUsername(
    username: string,
    currentUserId: number | null
  ): Promise<IProfile | null>;

  /**
   * Follow a user.
   * @param currentUserId - User who is following
   * @param targetUsername - Username of user to follow
   * @returns Updated profile of the followed user
   * @throws NotFoundError if target user does not exist
   * @throws ConflictError if already following
   */
  follow(currentUserId: number, targetUsername: string): Promise<IProfile>;

  /**
   * Unfollow a user.
   * @param currentUserId - User who is unfollowing
   * @param targetUsername - Username of user to unfollow
   * @returns Updated profile of the unfollowed user
   * @throws NotFoundError if target user does not exist or not currently following
   */
  unfollow(currentUserId: number, targetUsername: string): Promise<IProfile>;
}
