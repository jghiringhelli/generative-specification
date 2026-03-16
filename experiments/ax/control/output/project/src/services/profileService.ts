import { ProfileRepository, ProfileData } from '../repositories/profileRepository';
import { UserRepository } from '../repositories/userRepository';

export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private userRepository: UserRepository
  ) {}

  async getProfile(
    username: string,
    currentUserId?: string
  ): Promise<ProfileData> {
    const user = await this.profileRepository.findByUsername(username);

    if (!user) {
      throw new Error('Profile not found');
    }

    let following = false;

    if (currentUserId) {
      following = await this.profileRepository.isFollowing(
        currentUserId,
        user.id
      );
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    };
  }

  async followUser(
    followerId: string,
    username: string
  ): Promise<ProfileData> {
    const userToFollow = await this.profileRepository.findByUsername(username);

    if (!userToFollow) {
      throw new Error('Profile not found');
    }

    if (followerId === userToFollow.id) {
      throw new Error('Cannot follow yourself');
    }

    await this.profileRepository.followUser(followerId, userToFollow.id);

    return {
      username: userToFollow.username,
      bio: userToFollow.bio,
      image: userToFollow.image,
      following: true
    };
  }

  async unfollowUser(
    followerId: string,
    username: string
  ): Promise<ProfileData> {
    const userToUnfollow = await this.profileRepository.findByUsername(
      username
    );

    if (!userToUnfollow) {
      throw new Error('Profile not found');
    }

    await this.profileRepository.unfollowUser(followerId, userToUnfollow.id);

    return {
      username: userToUnfollow.username,
      bio: userToUnfollow.bio,
      image: userToUnfollow.image,
      following: false
    };
  }
}
