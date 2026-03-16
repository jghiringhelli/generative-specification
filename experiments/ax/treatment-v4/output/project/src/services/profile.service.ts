import { IProfileRepository } from '../repositories/IProfileRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/**
 * Profile service.
 * Handles profile retrieval and follow/unfollow operations.
 */
export class ProfileService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Get user profile by username.
   * @param username - Target user's username
   * @param currentUserId - Optional current user ID for follow status
   * @returns Profile with follow status
   * @throws NotFoundError if user not found
   */
  async getProfile(username: string, currentUserId?: number): Promise<ProfileResponse> {
    const profile = await this.profileRepository.getByUsername(username, currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile', username);
    }

    return profile;
  }

  /**
   * Follow a user.
   * @param username - Username to follow
   * @param currentUserId - Current user ID
   * @returns Updated profile with following = true
   * @throws NotFoundError if target user not found
   * @throws ValidationError if trying to follow self
   */
  async followUser(username: string, currentUserId: number): Promise<ProfileResponse> {
    // Get target user
    const targetUser = await this.userRepository.findByUsername(username);
    if (!targetUser) {
      throw new NotFoundError('Profile', username);
    }

    // Cannot follow yourself
    if (targetUser.id === currentUserId) {
      throw new ValidationError('Cannot follow yourself');
    }

    // Check if already following
    const alreadyFollowing = await this.userRepository.isFollowing(currentUserId, targetUser.id);
    
    if (!alreadyFollowing) {
      await this.userRepository.follow(currentUserId, targetUser.id);
    }

    // Return profile with following = true (idempotent)
    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true
    };
  }

  /**
   * Unfollow a user.
   * @param username - Username to unfollow
   * @param currentUserId - Current user ID
   * @returns Updated profile with following = false
   * @throws NotFoundError if target user not found
   */
  async unfollowUser(username: string, currentUserId: number): Promise<ProfileResponse> {
    // Get target user
    const targetUser = await this.userRepository.findByUsername(username);
    if (!targetUser) {
      throw new NotFoundError('Profile', username);
    }

    // Check if currently following
    const isFollowing = await this.userRepository.isFollowing(currentUserId, targetUser.id);
    
    if (isFollowing) {
      await this.userRepository.unfollow(currentUserId, targetUser.id);
    }

    // Return profile with following = false (idempotent)
    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
