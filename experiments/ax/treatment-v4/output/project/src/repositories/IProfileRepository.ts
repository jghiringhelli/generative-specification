
/**
 * Profile repository port interface.
 * Profiles are read-only views of users with following status.
 */
export interface IProfileRepository {
  /**
   * Get a user's profile by username.
   * @param username - Target user's username
   * @param currentUserId - Optional current user ID for following status
   * @returns Profile or null if user not found
   */
  getByUsername(username: string, currentUserId?: number): Promise<ProfileEntity | null>;
}

export interface ProfileEntity {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}
