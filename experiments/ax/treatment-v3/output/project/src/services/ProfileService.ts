import { IProfileRepository, Profile } from '../repositories/IProfileRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

/**
 * Profile service - business logic for user profiles and follows.
 * Depends on IProfileRepository and IUserRepository interfaces (injected).
 */
export class ProfileService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Get a user's profile by username.
   * @param username - Target user's username
   * @param currentUserId - Optional current user ID (for follow status)
   * @returns Profile with follow status
   * @throws NotFoundError if user not found
   */
  async getProfile(username: string, currentUserId?: number): Promise<Profile> {
    const profile = await this.profileRepository.findByUsername(username, currentUserId);
    
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    return profile;
  }

  /**
   * Follow a user.
   * @param currentUserId - ID of user who is following
   * @param username - Username of user to follow
   * @returns Updated profile with following=true
   * @throws NotFoundError if target user not found
   * @throws ValidationError if trying to follow self or already following
   */
  async followUser(currentUserId: number, username: string): Promise<Profile> {
    const targetUser = await this.userRepository.findByUsername(username);
    
    if (!targetUser) {
      throw new NotFoundError('Profile');
    }

    if (targetUser.id === currentUserId) {
      throw new ValidationError('Cannot follow yourself');
    }

    const isAlreadyFollowing = await this.profileRepository.isFollowing(
      currentUserId,
      targetUser.id
    );

    if (isAlreadyFollowing) {
      throw new ValidationError('Already following this user');
    }

    await this.profileRepository.follow(currentUserId, targetUser.id);

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true
    };
  }

  /**
   * Unfollow a user.
   * @param currentUserId - ID of user who is unfollowing
   * @param username - Username of user to unfollow
   * @returns Updated profile with following=false
   * @throws NotFoundError if target user not found
   * @throws ValidationError if not currently following
   */
  async unfollowUser(currentUserId: number, username: string): Promise<Profile> {
    const targetUser = await this.userRepository.findByUsername(username);
    
    if (!targetUser) {
      throw new NotFoundError('Profile');
    }

    const isFollowing = await this.profileRepository.isFollowing(
      currentUserId,
      targetUser.id
    );

    if (!isFollowing) {
      throw new ValidationError('Not following this user');
    }

    await this.profileRepository.unfollow(currentUserId, targetUser.id);

    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
