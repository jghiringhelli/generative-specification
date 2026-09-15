import type { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { FollowRepository } from '../repositories/follow.repository';
import { NotFoundError } from '../errors';

/** Public representation of a user profile. */
export interface ProfileView {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/**
 * Application service implementing profile viewing and follow use cases.
 */
export class ProfileService {
  private readonly userRepository: UserRepository;
  private readonly followRepository: FollowRepository;

  constructor(
    userRepository: UserRepository,
    followRepository: FollowRepository
  ) {
    this.userRepository = userRepository;
    this.followRepository = followRepository;
  }

  /**
   * Fetches a profile by username, reflecting the follow state for the viewer.
   * @param username The profile owner's username.
   * @param currentUserId The viewing user's id, if authenticated.
   * @returns The profile view.
   * @throws {NotFoundError} When no such profile exists.
   */
  async getProfile(
    username: string,
    currentUserId?: number
  ): Promise<ProfileView> {
    const target = await this.requireUser(username);
    return this.toView(target, currentUserId);
  }

  /**
   * Follows a user idempotently.
   * @param username The username to follow.
   * @param currentUserId The authenticated follower's id.
   * @returns The updated profile view.
   * @throws {NotFoundError} When no such profile exists.
   */
  async follow(username: string, currentUserId: number): Promise<ProfileView> {
    const target = await this.requireUser(username);
    if (target.id !== currentUserId) {
      await this.followRepository.follow(currentUserId, target.id);
    }
    return this.toView(target, currentUserId);
  }

  /**
   * Unfollows a user idempotently.
   * @param username The username to unfollow.
   * @param currentUserId The authenticated follower's id.
   * @returns The updated profile view.
   * @throws {NotFoundError} When no such profile exists.
   */
  async unfollow(
    username: string,
    currentUserId: number
  ): Promise<ProfileView> {
    const target = await this.requireUser(username);
    await this.followRepository.unfollow(currentUserId, target.id);
    return this.toView(target, currentUserId);
  }

  private async requireUser(username: string): Promise<User> {
    const target = await this.userRepository.findByUsername(username);
    if (!target) {
      throw new NotFoundError('profile does not exist');
    }
    return target;
  }

  private async toView(
    target: User,
    currentUserId?: number
  ): Promise<ProfileView> {
    const following =
      currentUserId !== undefined
        ? await this.followRepository.isFollowing(currentUserId, target.id)
        : false;
    return {
      username: target.username,
      bio: target.bio,
      image: target.image,
      following
    };
  }
}
