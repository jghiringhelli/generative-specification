import { UserRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/errors';
import { ProfileResponse, toProfileResponse } from './user.presenter';

/**
 * Application service for viewing and mutating follow relationships.
 */
export class ProfileService {
  constructor(private readonly users: UserRepository) {}

  /**
   * Returns a profile, reflecting whether the viewer follows the owner.
   * @param username the profile owner's username.
   * @param viewerId the authenticated viewer id, if any.
   * @returns the profile response DTO.
   */
  async getProfile(username: string, viewerId?: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    const following = viewerId ? await this.users.isFollowing(viewerId, target.id) : false;
    return toProfileResponse(target, following);
  }

  /**
   * Idempotently follows a profile on behalf of the viewer.
   * @param username the profile owner's username.
   * @param viewerId the authenticated viewer id.
   * @returns the profile response DTO with following=true.
   */
  async follow(username: string, viewerId: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    await this.users.follow(viewerId, target.id);
    return toProfileResponse(target, true);
  }

  /**
   * Idempotently unfollows a profile on behalf of the viewer.
   * @param username the profile owner's username.
   * @param viewerId the authenticated viewer id.
   * @returns the profile response DTO with following=false.
   */
  async unfollow(username: string, viewerId: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    await this.users.unfollow(viewerId, target.id);
    return toProfileResponse(target, false);
  }

  private async requireUser(username: string) {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new NotFoundError('profile does not exist');
    }
    return user;
  }
}
