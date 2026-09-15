import { ProfileRepository, profileRepository } from '../repositories/profile.repository';
import { NotFoundError } from '../lib/errors';
import { ProfileResponse } from '../types';

export class ProfileService {
  constructor(private profileRepo: ProfileRepository = profileRepository) {}

  async getProfile(targetUsername: string, currentUserId?: number): Promise<ProfileResponse> {
    const user = await this.profileRepo.findByUsername(targetUsername);
    if (!user) {
      throw new NotFoundError(`Profile for user '${targetUsername}' not found`);
    }

    let following = false;
    if (currentUserId) {
      following = await this.profileRepo.isFollowing(currentUserId, user.id);
    }

    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following
      }
    };
  }

  async followUser(targetUsername: string, currentUserId: number): Promise<ProfileResponse> {
    const user = await this.profileRepo.findByUsername(targetUsername);
    if (!user) {
      throw new NotFoundError(`Profile for user '${targetUsername}' not found`);
    }

    if (currentUserId !== user.id) {
      await this.profileRepo.follow(currentUserId, user.id);
    }

    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: true
      }
    };
  }

  async unfollowUser(targetUsername: string, currentUserId: number): Promise<ProfileResponse> {
    const user = await this.profileRepo.findByUsername(targetUsername);
    if (!user) {
      throw new NotFoundError(`Profile for user '${targetUsername}' not found`);
    }

    await this.profileRepo.unfollow(currentUserId, user.id);

    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: false
      }
    };
  }
}

export const profileService = new ProfileService();
