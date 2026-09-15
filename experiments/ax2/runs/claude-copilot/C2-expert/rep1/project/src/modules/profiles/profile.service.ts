import { User } from '@prisma/client';
import { ProfileRepository } from './profile.repository';
import { NotFoundError } from '../../lib/errors';

/** RealWorld profile envelope. */
export interface ProfileResponse {
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/**
 * Business logic for viewing and following user profiles.
 */
export class ProfileService {
  /** @param profileRepository injected persistence port */
  constructor(private readonly profileRepository: ProfileRepository) {}

  /**
   * Builds the profile DTO for a target user.
   * @param target the profile owner
   * @param following whether the viewer follows the target
   * @returns the profile response DTO
   */
  private toResponse(target: User, following: boolean): ProfileResponse {
    return {
      profile: {
        username: target.username,
        bio: target.bio,
        image: target.image,
        following
      }
    };
  }

  /**
   * Resolves a target user by username or throws.
   * @param username the profile username
   * @returns the found user
   * @throws NotFoundError when no such user exists
   */
  private async requireUser(username: string): Promise<User> {
    const user = await this.profileRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile not found');
    }
    return user;
  }

  /**
   * Retrieves a profile, computing `following` for an optional viewer.
   * @param username the profile username
   * @param viewerId the authenticated viewer id, if any
   * @returns the profile response
   */
  async getProfile(username: string, viewerId?: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    const following = viewerId
      ? await this.profileRepository.isFollowing(viewerId, target.id)
      : false;
    return this.toResponse(target, following);
  }

  /**
   * Follows a user (idempotent).
   * @param username the username to follow
   * @param viewerId the authenticated follower id
   * @returns the profile response with `following: true`
   */
  async follow(username: string, viewerId: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    await this.profileRepository.follow(viewerId, target.id);
    return this.toResponse(target, true);
  }

  /**
   * Unfollows a user (idempotent).
   * @param username the username to unfollow
   * @param viewerId the authenticated follower id
   * @returns the profile response with `following: false`
   */
  async unfollow(username: string, viewerId: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    await this.profileRepository.unfollow(viewerId, target.id);
    return this.toResponse(target, false);
  }
}
