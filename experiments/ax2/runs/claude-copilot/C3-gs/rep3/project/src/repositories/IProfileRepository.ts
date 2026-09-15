/**
 * Persistence contract for follow relationships between users.
 */
export interface IProfileRepository {
  /** Record that followerId follows followingId (idempotent). */
  follow(followerId: number, followingId: number): Promise<void>;
  /** Remove the follow relationship (idempotent). */
  unfollow(followerId: number, followingId: number): Promise<void>;
  /** Whether followerId currently follows followingId. */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
}
