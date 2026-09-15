import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { ProfileDTO } from '../dto';
import { User } from '../domain/types';
import { NotFoundError } from '../errors/AppError';

/**
 * Business logic for viewing profiles and managing follow relationships.
 */
export class ProfileService {
  private readonly users: IUserRepository;
  private readonly profiles: IProfileRepository;

  /**
   * @param users - User repository port.
   * @param profiles - Follow relationship repository port.
   */
  constructor(users: IUserRepository, profiles: IProfileRepository) {
    this.users = users;
    this.profiles = profiles;
  }

  /**
   * Get a user's profile relative to an optional viewer.
   * @param username - Target username.
   * @param viewerId - Viewing user's id, if authenticated.
   * @returns The profile view.
   * @throws NotFoundError if the target user does not exist.
   */
  async getProfile(username: string, viewerId?: number): Promise<ProfileDTO> {
    const target = await this.requireUser(username);
    const following = await this.resolveFollowing(viewerId, target.id);
    return this.toProfileDTO(target, following);
  }

  /**
   * Follow a user.
   * @param username - Target username.
   * @param viewerId - Authenticated follower id.
   * @returns The updated profile view (following = true).
   * @throws NotFoundError if the target user does not exist.
   */
  async follow(username: string, viewerId: number): Promise<ProfileDTO> {
    const target = await this.requireUser(username);
    await this.profiles.follow(viewerId, target.id);
    return this.toProfileDTO(target, true);
  }

  /**
   * Unfollow a user.
   * @param username - Target username.
   * @param viewerId - Authenticated follower id.
   * @returns The updated profile view (following = false).
   * @throws NotFoundError if the target user does not exist.
   */
  async unfollow(username: string, viewerId: number): Promise<ProfileDTO> {
    const target = await this.requireUser(username);
    await this.profiles.unfollow(viewerId, target.id);
    return this.toProfileDTO(target, false);
  }

  /**
   * Build the profile view for an already-loaded user relative to a viewer.
   * @param user - The target user.
   * @param viewerId - The viewer id, if any.
   * @returns The profile view.
   */
  async buildProfile(user: User, viewerId?: number): Promise<ProfileDTO> {
    const following = await this.resolveFollowing(viewerId, user.id);
    return this.toProfileDTO(user, following);
  }

  /**
   * Load a user by username or throw.
   * @param username - Target username.
   * @returns The user.
   * @throws NotFoundError if not found.
   */
  private async requireUser(username: string): Promise<User> {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile not found');
    }
    return user;
  }

  /**
   * Resolve whether the viewer follows the target.
   * @param viewerId - Viewer id, if any.
   * @param targetId - Target user id.
   * @returns True when following.
   */
  private async resolveFollowing(
    viewerId: number | undefined,
    targetId: number,
  ): Promise<boolean> {
    if (viewerId === undefined || viewerId === targetId) {
      return false;
    }
    return this.profiles.isFollowing(viewerId, targetId);
  }

  /**
   * Map a user and following flag to a profile DTO.
   * @param user - The target user.
   * @param following - Whether the viewer follows the target.
   * @returns The profile view.
   */
  private toProfileDTO(user: User, following: boolean): ProfileDTO {
    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    };
  }
}
