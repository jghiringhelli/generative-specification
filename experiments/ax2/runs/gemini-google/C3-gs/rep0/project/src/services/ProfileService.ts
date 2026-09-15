// src/services/ProfileService.ts
import { IProfileRepository } from '../repositories/IProfileRepository';
import { ProfileResponse } from '../types';
import { NotFoundError } from '../errors/AppError';

export class ProfileService {
  private profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async getProfile(username: string, currentUserId?: string): Promise<ProfileResponse> {
    const profile = await this.profileRepository.findByUsername(username, currentUserId);
    if (!profile) {
      throw new NotFoundError(`Profile for username '${username}' not found`);
    }
    return profile;
  }

  async follow(followerId: string, usernameToFollow: string): Promise<ProfileResponse> {
    return this.profileRepository.followUser(followerId, usernameToFollow);
  }

  async unfollow(followerId: string, usernameToUnfollow: string): Promise<ProfileResponse> {
    return this.profileRepository.unfollowUser(followerId, usernameToUnfollow);
  }
}
