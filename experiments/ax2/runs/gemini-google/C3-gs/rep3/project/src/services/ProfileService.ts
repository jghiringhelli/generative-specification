// src/services/ProfileService.ts
import { IProfileRepository, ProfileRecord } from '../repositories/IProfileRepository';
import { NotFoundError } from '../errors/AppError';

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  public async getProfile(username: string, currentUserId?: string): Promise<ProfileRecord> {
    const profile = await this.profileRepository.findByUsername(username, currentUserId);
    if (!profile) {
      throw new NotFoundError(`Profile for '${username}' not found`);
    }
    return profile;
  }

  public async follow(followerId: string, username: string): Promise<ProfileRecord> {
    return this.profileRepository.follow(followerId, username);
  }

  public async unfollow(followerId: string, username: string): Promise<ProfileRecord> {
    return this.profileRepository.unfollow(followerId, username);
  }
}
