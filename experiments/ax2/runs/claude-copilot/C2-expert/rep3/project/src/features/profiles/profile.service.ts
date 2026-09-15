import { User } from '@prisma/client';
import { ProfileRepository } from './profile.repository';
import { NotFoundError } from '../../utils/errors';

/** Serialized profile shape returned by the API. */
export interface ProfileResponse {
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/**
 * Business logic for viewing profiles and managing follow relationships.
 */
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  /**
   * Retrieves a profile by username.
   * @param username the profile's username
   * @param currentUserId the authenticated user id, if any
   * @returns the profile response
   * @throws NotFoundError when the profile does not exist
   */
  async getProfile(
    username: string,
    currentUserId?: number,
  ): Promise<ProfileResponse> {
    const user = await this.profileRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('profile not found');
    }
    const following = await this.resolveFollowing(currentUserId, user.id);
    return this.toResponse(user, following);
  }

  /**
   * Follows a user idempotently.
   * @param username the username to follow
   * @param currentUserId the authenticated user id
   * @returns the profile response with following=true
   * @throws NotFoundError when the target profile does not exist
   */
  async followUser(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponse> {
    const user = await this.profileRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('profile not found');
    }
    await this.profileRepository.follow(currentUserId, user.id);
    return this.toResponse(user, true);
  }

  /**
   * Unfollows a user idempotently.
   * @param username the username to unfollow
   * @param currentUserId the authenticated user id
   * @returns the profile response with following=false
   * @throws NotFoundError when the target profile does not exist
   */
  async unfollowUser(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponse> {
    const user = await this.profileRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('profile not found');
    }
    await this.profileRepository.unfollow(currentUserId, user.id);
    return this.toResponse(user, false);
  }

  /**
   * Resolves the following flag for a viewer against a target user.
   * @param currentUserId the viewer's id, if authenticated
   * @param targetId the target user's id
   * @returns true when the viewer follows the target
   */
  private async resolveFollowing(
    currentUserId: number | undefined,
    targetId: number,
  ): Promise<boolean> {
    if (!currentUserId) {
      return false;
    }
    return this.profileRepository.isFollowing(currentUserId, targetId);
  }

  /**
   * Maps a user entity to the profile response shape.
   * @param user the persisted user entity
   * @param following whether the viewer follows this user
   * @returns the serialized profile response
   */
  private toResponse(user: User, following: boolean): ProfileResponse {
    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following,
      },
    };
  }
}
