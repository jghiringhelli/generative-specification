
/**
 * Profile service.
 * Handles profile retrieval and follow/unfollow operations.
 */

import type { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError } from '../errors/AppError';

export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Get user profile by username.
   * @param username - Target user's username
   * @param currentUserId - ID of user viewing the profile (null if anonymous)
   * @throws NotFoundError if user does not exist
   */
  async getProfile(
    username: string,
    currentUserId: number | null
  ): Promise<ProfileResponse> {
    const profile = await this.profileRepository.getByUsername(username, currentUserId);

    if (!profile) {
      throw new NotFoundError('User', username);
    }

    return profile;
  }

  /**
   * Follow a user.
   * @param currentUserId - User who is following
   * @param targetUsername - Username of user to follow
   * @throws NotFoundError if target user does not exist
   * @throws ConflictError if already following or attempting to follow self
   */
  async followUser(currentUserId: number, targetUsername: string): Promise<ProfileResponse> {
    return await this.profileRepository.follow(currentUserId, targetUsername);
  }

  /**
   * Unfollow a user.
   * @param currentUserId - User who is unfollowing
   * @param targetUsername - Username of user to unfollow
   * @throws NotFoundError if target user does not exist or not currently following
   */
  async unfollowUser(currentUserId: number, targetUsername: string): Promise<ProfileResponse> {
    return await this.profileRepository.unfollow(currentUserId, targetUsername);
  }
}
