import type { UserProfile } from '../types/domain';
import type { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError } from '../errors/AppError';

/**
 * Business logic for user profile and follow operations.
 *
 * Depends on `IProfileRepository` (injected) — never on concrete Prisma classes.
 * Wire the concrete implementation at the composition root (`src/server.ts`).
 */
export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Retrieve the public profile of a user by username.
   *
   * @param username - The target user's username
   * @param currentUserId - Optional authenticated viewer ID for `following` computation
   * @returns The user's public profile
   * @throws `NotFoundError` if no user with that username exists
   */
  async getProfile(username: string, currentUserId?: number): Promise<UserProfile> {
    const profile = await this.profileRepository.findByUsername(username, currentUserId);
    if (!profile) throw new NotFoundError('profile');
    return profile;
  }

  /**
   * Follow a user by username.
   *
   * @param currentUserId - ID of the authenticated user performing the follow
   * @param username - Username of the user to follow
   * @returns The followed user's profile with `following: true`
   * @throws `NotFoundError` if no user with that username exists
   */
  async followUser(currentUserId: number, username: string): Promise<UserProfile> {
    return this.profileRepository.follow(currentUserId, username);
  }

  /**
   * Unfollow a user by username.
   *
   * @param currentUserId - ID of the authenticated user removing the follow
   * @param username - Username of the user to unfollow
   * @returns The unfollowed user's profile with `following: false`
   * @throws `NotFoundError` if no user with that username exists
   */
  async unfollowUser(currentUserId: number, username: string): Promise<UserProfile> {
    return this.profileRepository.unfollow(currentUserId, username);
  }
}
