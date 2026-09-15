import { IProfileRepository } from '../repositories/IProfileRepository';
import { ProfileResponseDto } from '../types';
import { NotFoundError } from '../errors/AppError';

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Retrieves profile details for the specified username.
   * @param username - Username of the requested profile.
   * @param currentUserId - Optional id of the authenticated user.
   */
  async getProfile(username: string, currentUserId?: string): Promise<ProfileResponseDto> {
    const profileData = await this.profileRepository.findProfile(username, currentUserId);
    if (!profileData) {
      throw new NotFoundError(`Profile for '${username}' not found`);
    }

    return {
      username: profileData.user.username,
      bio: profileData.user.bio ?? '',
      image: profileData.user.image ?? '',
      following: profileData.following
    };
  }

  /**
   * Follows a target user profile.
   * @param followerId - Id of the follower user.
   * @param username - Username of target user to follow.
   */
  async followUser(followerId: string, username: string): Promise<ProfileResponseDto> {
    const profileData = await this.profileRepository.follow(followerId, username);
    return {
      username: profileData.user.username,
      bio: profileData.user.bio ?? '',
      image: profileData.user.image ?? '',
      following: profileData.following
    };
  }

  /**
   * Unfollows a target user profile.
   * @param followerId - Id of the follower user.
   * @param username - Username of target user to unfollow.
   */
  async unfollowUser(followerId: string, username: string): Promise<ProfileResponseDto> {
    const profileData = await this.profileRepository.unfollow(followerId, username);
    return {
      username: profileData.user.username,
      bio: profileData.user.bio ?? '',
      image: profileData.user.image ?? '',
      following: profileData.following
    };
  }
}
