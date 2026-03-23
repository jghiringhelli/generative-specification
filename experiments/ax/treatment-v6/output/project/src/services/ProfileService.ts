import type { IProfileRepository } from '../repositories/IProfileRepository.js';
import { NotFoundError } from '../errors/AppError.js';

/** Profile response shape per RealWorld API spec. */
export interface ProfileResponse {
  readonly profile: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

/**
 * Service handling user profile lookups and follow/unfollow operations.
 * Depends on IProfileRepository (injected at composition root).
 */
export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Get a user's public profile.
   * @param username - The target user's username.
   * @param currentUserId - Optional ID of the requesting user for following state.
   * @returns The profile response.
   */
  async getProfile(username: string, currentUserId?: number): Promise<ProfileResponse> {
    const profile = await this.profileRepository.findByUsername(username, currentUserId);
    if (!profile) {
      throw new NotFoundError('User', username);
    }
    return { profile };
  }

  /**
   * Follow a user.
   * @param followerId - The authenticated user's ID.
   * @param username - The username of the user to follow.
   * @returns The followed user's profile.
   */
  async followUser(followerId: number, username: string): Promise<ProfileResponse> {
    const profile = await this.profileRepository.follow(followerId, username);
    return { profile };
  }

  /**
   * Unfollow a user.
   * @param followerId - The authenticated user's ID.
   * @param username - The username of the user to unfollow.
   * @returns The unfollowed user's profile.
   */
  async unfollowUser(followerId: number, username: string): Promise<ProfileResponse> {
    const profile = await this.profileRepository.unfollow(followerId, username);
    return { profile };
  }
}
