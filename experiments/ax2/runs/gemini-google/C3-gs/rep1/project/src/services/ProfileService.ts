import { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError } from '../errors/AppError';

export interface ProfileResponseDTO {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export class ProfileService {
  private readonly profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async getProfile(
    username: string,
    currentUserId?: string
  ): Promise<ProfileResponseDTO> {
    const profile = await this.profileRepository.findByUsername(username);
    if (!profile) {
      throw new NotFoundError(`Profile '${username}' not found`);
    }

    let following = false;
    if (currentUserId && currentUserId !== profile.id) {
      following = await this.profileRepository.isFollowing(currentUserId, profile.id);
    }

    return {
      username: profile.username,
      bio: profile.bio ?? '',
      image: profile.image ?? '',
      following,
    };
  }

  async followUser(
    username: string,
    currentUserId: string
  ): Promise<ProfileResponseDTO> {
    const profile = await this.profileRepository.findByUsername(username);
    if (!profile) {
      throw new NotFoundError(`Profile '${username}' not found`);
    }

    if (currentUserId !== profile.id) {
      await this.profileRepository.follow(currentUserId, profile.id);
    }

    return {
      username: profile.username,
      bio: profile.bio ?? '',
      image: profile.image ?? '',
      following: true,
    };
  }

  async unfollowUser(
    username: string,
    currentUserId: string
  ): Promise<ProfileResponseDTO> {
    const profile = await this.profileRepository.findByUsername(username);
    if (!profile) {
      throw new NotFoundError(`Profile '${username}' not found`);
    }

    if (currentUserId !== profile.id) {
      await this.profileRepository.unfollow(currentUserId, profile.id);
    }

    return {
      username: profile.username,
      bio: profile.bio ?? '',
      image: profile.image ?? '',
      following: false,
    };
  }
}
