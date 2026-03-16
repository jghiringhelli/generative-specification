
/**
 * User repository port interface.
 * Domain layer defines WHAT operations are needed.
 * Adapter layer (PrismaUserRepository) implements HOW.
 */
export interface IUserRepository {
  /**
   * Find user by unique email.
   * @returns User or null if not found
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Find user by unique username.
   * @returns User or null if not found
   */
  findByUsername(username: string): Promise<UserEntity | null>;

  /**
   * Find user by ID.
   * @returns User or null if not found
   */
  findById(id: number): Promise<UserEntity | null>;

  /**
   * Create a new user.
   * @param data - User creation data (email, username, passwordHash)
   * @returns Created user
   */
  create(data: CreateUserData): Promise<UserEntity>;

  /**
   * Update an existing user.
   * @param id - User ID
   * @param data - Partial update data
   * @returns Updated user
   */
  update(id: number, data: UpdateUserData): Promise<UserEntity>;

  /**
   * Check if user follows another user.
   * @param followerId - ID of the follower
   * @param followingId - ID of the user being followed
   * @returns true if follow relationship exists
   */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;

  /**
   * Create a follow relationship.
   * @param followerId - ID of the follower
   * @param followingId - ID of the user to follow
   */
  follow(followerId: number, followingId: number): Promise<void>;

  /**
   * Remove a follow relationship.
   * @param followerId - ID of the follower
   * @param followingId - ID of the user to unfollow
   */
  unfollow(followerId: number, followingId: number): Promise<void>;
}

export interface UserEntity {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  bio?: string;
  image?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  passwordHash?: string;
  bio?: string;
  image?: string;
}
