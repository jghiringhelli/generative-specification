import { UserEntity } from '../domain/entities';

/**
 * Persistence port for the follow relationship between users.
 */
export interface IProfileRepository {
  /** Create a follow edge from follower to following (idempotent). */
  follow(followerId: string, followingId: string): Promise<void>;

  /** Remove the follow edge from follower to following (idempotent). */
  unfollow(followerId: string, followingId: string): Promise<void>;

  /** True when followerId currently follows followingId. */
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  /** Find a user by username to resolve a profile, or null. */
  findUserByUsername(username: string): Promise<UserEntity | null>;
}
