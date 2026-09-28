import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserProfile } from '../../domain/entities/User';

export class ProfileService {
  constructor(private userRepository: IUserRepository) {}

  async getProfile(username: string, currentUserId?: number): Promise<UserProfile | null> {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

    let following = false;
    if (currentUserId) {
      following = await this.userRepository.isFollowing(currentUserId, user.id);
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    };
  }

  async followUser(username: string, currentUserId: number): Promise<UserProfile | null> {
    const userToFollow = await this.userRepository.findByUsername(username);

    if (!userToFollow) {
      return null;
    }

    if (userToFollow.id === currentUserId) {
      throw new Error('Cannot follow yourself');
    }

    await this.userRepository.follow(currentUserId, userToFollow.id);

    return {
      username: userToFollow.username,
      bio: userToFollow.bio,
      image: userToFollow.image,
      following: true
    };
  }

  async unfollowUser(username: string, currentUserId: number): Promise<UserProfile | null> {
    const userToUnfollow = await this.userRepository.findByUsername(username);

    if (!userToUnfollow) {
      return null;
    }

    await this.userRepository.unfollow(currentUserId, userToUnfollow.id);

    return {
      username: userToUnfollow.username,
      bio: userToUnfollow.bio,
      image: userToUnfollow.image,
      following: false
    };
  }
}
