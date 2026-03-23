/** Profile domain entity returned from repository operations. */
export interface Profile {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/**
 * Port interface for profile (follow/unfollow) persistence operations.
 * Services depend on this interface; Prisma implementation is injected at composition root.
 */
export interface IProfileRepository {
  /**
   * Find a user's profile by username.
   * @param username - The target user's username.
   * @param currentUserId - Optional current user ID for following state.
   * @returns The profile if found, null otherwise.
   */
  findByUsername(username: string, currentUserId?: number): Promise<Profile | null>;

  /**
   * Follow a user.
   * @param followerId - The ID of the user doing the following.
   * @param followingUsername - The username of the user to follow.
   * @returns The followed user's profile.
   */
  follow(followerId: number, followingUsername: string): Promise<Profile>;

  /**
   * Unfollow a user.
   * @param followerId - The ID of the user doing the unfollowing.
   * @param followingUsername - The username of the user to unfollow.
   * @returns The unfollowed user's profile.
   */
  unfollow(followerId: number, followingUsername: string): Promise<Profile>;

  /**
   * Check if one user is following another.
   * @param followerId - The potential follower's user ID.
   * @param followingId - The potentially followed user's ID.
   * @returns True if following, false otherwise.
   */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
}
