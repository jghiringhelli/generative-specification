import { IProfileRepository } from '../repositories/IProfileRepository';
import { ProfileView } from '../domain/entities';
import { toProfileView } from '../dto/views';
import { NotFoundError } from '../errors/AppError';

/**
 * Business logic for viewing profiles and following/unfollowing users.
 */
export class ProfileService {
  constructor(private readonly profiles: IProfileRepository) {}

  /** Resolve a public profile, marking whether the viewer follows the target. */
  async getProfile(username: string, viewerId: string | null): Promise<ProfileView> {
    const target = await this.requireUser(username);
    const following = viewerId ? await this.profiles.isFollowing(viewerId, target.id) : false;
    return toProfileView(target, following);
  }

  /** Follow the target user on behalf of the viewer. */
  async follow(username: string, viewerId: string): Promise<ProfileView> {
    const target = await this.requireUser(username);
    await this.profiles.follow(viewerId, target.id);
    return toProfileView(target, true);
  }

  /** Unfollow the target user on behalf of the viewer. */
  async unfollow(username: string, viewerId: string): Promise<ProfileView> {
    const target = await this.requireUser(username);
    await this.profiles.unfollow(viewerId, target.id);
    return toProfileView(target, false);
  }

  private async requireUser(username: string) {
    const user = await this.profiles.findUserByUsername(username);
    if (!user) {
      throw new NotFoundError('profile not found');
    }
    return user;
  }
}
