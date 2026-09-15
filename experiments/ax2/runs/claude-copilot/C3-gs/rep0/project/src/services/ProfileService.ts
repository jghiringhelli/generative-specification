import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { toProfileResponse, ProfileResponse } from '../dto/userView';
import { NotFoundError } from '../errors/AppError';
import { UserEntity } from '../domain/types';

/**
 * Business logic for viewing profiles and managing follow relationships.
 */
export class ProfileService {
  /**
   * @param userRepository - User lookup port.
   * @param profileRepository - Follow relationship port.
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * Load a user by username or throw a 404.
   * @param username - The target username.
   * @returns The user entity.
   */
  private async requireUser(username: string): Promise<UserEntity> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('profile not found');
    }
    return user;
  }

  /**
   * Get a profile, including whether the viewer follows it.
   * @param username - The target username.
   * @param viewerId - The authenticated viewer's id, if any.
   * @returns The profile response.
   */
  async getProfile(username: string, viewerId: number | undefined): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    const following = viewerId
      ? await this.profileRepository.isFollowing(viewerId, target.id)
      : false;
    return toProfileResponse(target, following);
  }

  /**
   * Follow a user.
   * @param username - The user to follow.
   * @param followerId - The authenticated follower's id.
   * @returns The profile response with following = true.
   */
  async follow(username: string, followerId: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    await this.profileRepository.follow(followerId, target.id);
    return toProfileResponse(target, true);
  }

  /**
   * Unfollow a user.
   * @param username - The user to unfollow.
   * @param followerId - The authenticated follower's id.
   * @returns The profile response with following = false.
   */
  async unfollow(username: string, followerId: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    await this.profileRepository.unfollow(followerId, target.id);
    return toProfileResponse(target, false);
  }
}
