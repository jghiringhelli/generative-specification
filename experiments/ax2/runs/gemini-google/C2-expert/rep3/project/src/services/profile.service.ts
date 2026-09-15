import { NotFoundError } from '../errors/app-error';
import { UserRepository } from '../repositories/user.repository';
import { ProfileResponseDto } from '../types/auth.types';

/**
 * Service managing user profiles and follow interactions.
 */
export class ProfileService {
  private readonly userRepository: UserRepository;

  /**
   * Initializes ProfileService.
   *
   * @param {UserRepository} [userRepository] Repository instance
   */
  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  /**
   * Retrieves profile for a given username.
   *
   * @param {string} username Target profile handle
   * @param {number} [currentUserId] Optional authenticated viewer user ID
   * @returns {Promise<ProfileResponseDto>} Profile data
   */
  async getProfile(username: string, currentUserId?: number): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile not found');
    }

    let following = false;
    if (currentUserId) {
      following = await this.userRepository.isFollowing(currentUserId, user.id);
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    };
  }

  /**
   * Follows a target user idempotently.
   *
   * @param {number} currentUserId Authenticated follower user ID
   * @param {string} targetUsername Target handle to follow
   * @returns {Promise<ProfileResponseDto>} Updated profile with following=true
   */
  async followUser(currentUserId: number, targetUsername: string): Promise<ProfileResponseDto> {
    const targetUser = await this.userRepository.findByUsername(targetUsername);
    if (!targetUser) {
      throw new NotFoundError('Profile not found');
    }

    await this.userRepository.follow(currentUserId, targetUser.id);

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true,
    };
  }

  /**
   * Unfollows a target user idempotently.
   *
   * @param {number} currentUserId Authenticated follower user ID
   * @param {string} targetUsername Target handle to unfollow
   * @returns {Promise<ProfileResponseDto>} Updated profile with following=false
   */
  async unfollowUser(currentUserId: number, targetUsername: string): Promise<ProfileResponseDto> {
    const targetUser = await this.userRepository.findByUsername(targetUsername);
    if (!targetUser) {
      throw new NotFoundError('Profile not found');
    }

    await this.userRepository.unfollow(currentUserId, targetUser.id);

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false,
    };
  }
}
