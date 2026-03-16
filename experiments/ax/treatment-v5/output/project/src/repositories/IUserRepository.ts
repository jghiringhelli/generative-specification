
/**
 * User repository interface.
 * Defines the contract for all user data access operations.
 * Implementations: PrismaUserRepository (production), InMemoryUserRepository (tests).
 */

export interface IUser {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface IUserRepository {
  /**
   * Find user by unique ID.
   * @returns User if found, null otherwise
   */
  findById(id: number): Promise<IUser | null>;

  /**
   * Find user by unique email address.
   * @returns User if found, null otherwise
   */
  findByEmail(email: string): Promise<IUser | null>;

  /**
   * Find user by unique username.
   * @returns User if found, null otherwise
   */
  findByUsername(username: string): Promise<IUser | null>;

  /**
   * Create a new user.
   * @throws ConflictError if email or username already exists
   */
  create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<IUser>;

  /**
   * Update user by ID.
   * Only provided fields are updated (partial update).
   * @throws NotFoundError if user does not exist
   * @throws ConflictError if email/username conflicts with another user
   */
  update(
    id: number,
    data: {
      email?: string;
      username?: string;
      passwordHash?: string;
      bio?: string | null;
      image?: string | null;
    }
  ): Promise<IUser>;

  /**
   * Get user profile with following status from perspective of current user.
   * @param username - Target user's username
   * @param currentUserId - ID of the user viewing the profile (null if anonymous)
   * @returns Profile if user exists, null otherwise
   */
  getProfile(
    username: string,
    currentUserId: number | null
  ): Promise<IUserProfile | null>;

  /**
   * Create a follow relationship.
   * @param followerId - User who is following
   * @param followingId - User being followed
   * @throws ConflictError if already following
   */
  follow(followerId: number, followingId: number): Promise<void>;

  /**
   * Remove a follow relationship.
   * @param followerId - User who is unfollowing
   * @param followingId - User being unfollowed
   * @throws NotFoundError if not currently following
   */
  unfollow(followerId: number, followingId: number): Promise<void>;

  /**
   * Check if follower is following the specified user.
   */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
}
