import { User } from '@prisma/client';
import { NotFoundError } from '../errors/AppError';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { IUserRepository } from '../repositories/IUserRepository';

/**
 * A profile paired with the requesting user's follow state.
 */
export interface ProfileResult {
  user: User;
  following: boolean;
}

/**
 * Application service for viewing and following user profiles.
 */
export class ProfileService {
  private readonly userRepository: IUserRepository;
  private readonly profileRepository: IProfileRepository;

  /**
   * @param userRepository - User persistence port.
   * @param profileRepository - Follow-relationship persistence port.
   */
  constructor(userRepository: IUserRepository, profileRepository: IProfileRepository) {
    this.userRepository = userRepository;
    this.profileRepository = profileRepository;
  }

  /**
   * Load a profile by username with follow state for the viewer.
   * @param username - Profile owner's username.
   * @param viewerId - Authenticated viewer id, if any.
   * @returns The profile owner and follow state.
   */
  async getProfile(username: string, viewerId?: number): Promise<ProfileResult> {
    const user = await this.requireUser(username);
    const following = await this.resolveFollowing(viewerId, user.id);
    return { user, following };
  }

  /**
   * Follow a user.
   * @param username - Username to follow.
   * @param followerId - Authenticated follower id.
   * @returns The followed profile with follow state true.
   */
  async follow(username: string, followerId: number): Promise<ProfileResult> {
    const user = await this.requireUser(username);
    await this.profileRepository.follow(followerId, user.id);
    return { user, following: true };
  }

  /**
   * Unfollow a user.
   * @param username - Username to unfollow.
   * @param followerId - Authenticated follower id.
   * @returns The unfollowed profile with follow state false.
   */
  async unfollow(username: string, followerId: number): Promise<ProfileResult> {
    const user = await this.requireUser(username);
    await this.profileRepository.unfollow(followerId, user.id);
    return { user, following: false };
  }

  /**
   * Resolve a user by username or throw NotFoundError.
   * @param username - Username to look up.
   * @returns The user.
   */
  private async requireUser(username: string): Promise<User> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile not found');
    }
    return user;
  }

  /**
   * Determine whether the viewer follows the target user.
   * @param viewerId - Viewer id, if authenticated.
   * @param targetId - Target user id.
   * @returns True when the viewer follows the target.
   */
  private async resolveFollowing(viewerId: number | undefined, targetId: number): Promise<boolean> {
    if (viewerId === undefined) {
      return false;
    }
    return this.profileRepository.isFollowing(viewerId, targetId);
  }
}
