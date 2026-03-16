import { IProfileRepository, Profile } from '../repositories/IProfileRepository';
import { NotFoundError } from '../errors/NotFoundError';
import { ValidationError } from '../errors/ValidationError';

export interface ProfileResponse {
  profile: Profile;
}

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Get a user profile by username
   * @throws NotFoundError if user does not exist
   */
  async getProfile(username: string, currentUserId?: number): Promise<ProfileResponse> {
    const profile = await this.profileRepository.getProfile(username, currentUserId);
    
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    return { profile };
  }

  /**
   * Follow a user
   * @throws NotFoundError if target user does not exist
   * @throws ValidationError if trying to follow yourself
   */
  async followUser(currentUserId: number, targetUsername: string): Promise<ProfileResponse> {
    try {
      const profile = await this.profileRepository.follow(currentUserId, targetUsername);
      return { profile };
    } catch (error) {
      if (error instanceof Error && error.message === 'Target user not found') {
        throw new NotFoundError('Profile');
      }
      throw error;
    }
  }

  /**
   * Unfollow a user
   * @throws NotFoundError if target user does not exist
   */
  async unfollowUser(currentUserId: number, targetUsername: string): Promise<ProfileResponse> {
    try {
      const profile = await this.profileRepository.unfollow(currentUserId, targetUsername);
      return { profile };
    } catch (error) {
      if (error instanceof Error && error.message === 'Target user not found') {
        throw new NotFoundError('Profile');
      }
      throw error;
    }
  }
}
