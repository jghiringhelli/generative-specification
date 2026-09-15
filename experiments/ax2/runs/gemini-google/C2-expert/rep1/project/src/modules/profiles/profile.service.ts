import { IProfileRepository, ProfileRepository } from './profile.repository';
import { ProfileData } from './profile.dto';
import { NotFoundError } from '../../errors/app-error';

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository = new ProfileRepository()) {}

  async getProfile(username: string, currentUserId?: string): Promise<ProfileData> {
    const user = await this.profileRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError(`Profile for user '${username}' not found`);
    }

    let following = false;
    if (currentUserId) {
      following = await this.profileRepository.isFollowing(currentUserId, user.id);
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    };
  }

  async followUser(username: string, currentUserId: string): Promise<ProfileData> {
    const user = await this.profileRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError(`Profile for user '${username}' not found`);
    }

    if (user.id !== currentUserId) {
      await this.profileRepository.follow(currentUserId, user.id);
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: true
    };
  }

  async unfollowUser(username: string, currentUserId: string): Promise<ProfileData> {
    const user = await this.profileRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError(`Profile for user '${username}' not found`);
    }

    await this.profileRepository.unfollow(currentUserId, user.id);

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: false
    };
  }
}
