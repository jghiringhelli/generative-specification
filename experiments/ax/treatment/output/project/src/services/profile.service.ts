import { IUserRepository } from '../repositories/user.repository';
import { IProfileRepository } from '../repositories/profile.repository';
import { ProfileResponse } from '../types/profile.types';
import { NotFoundError } from '../errors';

/**
 * Profile service.
 * Handles user profile operations and follow relationships.
 */
export class ProfileService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * Get user profile by username.
   * @param username Target user's username
   * @param currentUserId Optional current user ID to check follow status
   * @throws NotFoundError if user not found
   */
  async getProfile(
    username: string,
    currentUserId?: number
  ): Promise<ProfileResponse> {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new NotFoundError('Profile', username);
    }

    const following = currentUserId
      ? await this.profileRepository.isFollowing(currentUserId, user.id)
      : false;

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    };
  }

  /**
   * Follow a user.
   * Idempotent - returns success even if already following.
   * @param currentUserId User initiating the follow
   * @param username User to follow
   * @throws NotFoundError if target user not found
   */
  async followUser(
    currentUserId: number,
    username: string
  ): Promise<ProfileResponse> {
    const targetUser = await this.userRepository.findByUsername(username);

    if (!targetUser) {
      throw new NotFoundError('Profile', username);
    }

    // Cannot follow yourself
    if (targetUser.id === currentUserId) {
      throw new NotFoundError('Profile', username);
    }

    await this.profileRepository.follow(currentUserId, targetUser.id);

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true
    };
  }

  /**
   * Unfollow a user.
   * Idempotent - returns success even if not following.
   * @param currentUserId User initiating the unfollow
   * @param username User to unfollow
   * @throws NotFoundError if target user not found
   */
  async unfollowUser(
    currentUserId: number,
    username: string
  ): Promise<ProfileResponse> {
    const targetUser = await this.userRepository.findByUsername(username);

    if (!targetUser) {
      throw new NotFoundError('Profile', username);
    }

    await this.profileRepository.unfollow(currentUserId, targetUser.id);

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
