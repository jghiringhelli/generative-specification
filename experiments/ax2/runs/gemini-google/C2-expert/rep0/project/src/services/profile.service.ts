import { IProfileRepository, ProfileRepository } from '../repositories/profile.repository';
import { ProfileResponse } from '../types/profile.types';
import { NotFoundError } from '../utils/error.util';

export interface IProfileService {
  getProfile(targetUsername: string, currentUserId?: number): Promise<ProfileResponse>;
  followUser(followerId: number, targetUsername: string): Promise<ProfileResponse>;
  unfollowUser(followerId: number, targetUsername: string): Promise<ProfileResponse>;
}

export class ProfileService implements IProfileService {
  private readonly profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository = new ProfileRepository()) {
    this.profileRepository = profileRepository;
  }

  /**
   * Fetches user profile by username.
   *
   * @param {string} targetUsername - Username of profile to inspect
   * @param {number} [currentUserId] - Optional current authenticated user ID
   * @returns {Promise<ProfileResponse>} Profile response object
   */
  public async getProfile(
    targetUsername: string,
    currentUserId?: number
  ): Promise<ProfileResponse> {
    const profile = await this.profileRepository.findProfileByUsername(
      targetUsername,
      currentUserId
    );

    if (!profile) {
      throw new NotFoundError(`Profile '${targetUsername}' not found`);
    }

    return { profile };
  }

  /**
   * Follows a user by username.
   *
   * @param {number} followerId - Current authenticated user ID
   * @param {string} targetUsername - Username of user to follow
   * @returns {Promise<ProfileResponse>} Profile response object with following=true
   */
  public async followUser(
    followerId: number,
    targetUsername: string
  ): Promise<ProfileResponse> {
    const profile = await this.profileRepository.followUser(followerId, targetUsername);
    if (!profile) {
      throw new NotFoundError(`Profile '${targetUsername}' not found`);
    }

    return { profile };
  }

  /**
   * Unfollows a user by username.
   *
   * @param {number} followerId - Current authenticated user ID
   * @param {string} targetUsername - Username of user to unfollow
   * @returns {Promise<ProfileResponse>} Profile response object with following=false
   */
  public async unfollowUser(
    followerId: number,
    targetUsername: string
  ): Promise<ProfileResponse> {
    const profile = await this.profileRepository.unfollowUser(followerId, targetUsername);
    if (!profile) {
      throw new NotFoundError(`Profile '${targetUsername}' not found`);
    }

    return { profile };
  }
}
