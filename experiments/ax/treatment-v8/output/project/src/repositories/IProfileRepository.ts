/**
 * Port: persistence boundary for the follow graph behind public profiles.
 *
 * A "profile" is a projection of a user plus the viewer's follow relationship;
 * this port owns the directed follow edges. Concrete adapters are injected at
 * the composition root.
 */

/** The follow relationship between two users (directed: follower → followed). */
export interface FollowRelation {
  readonly followerId: string;
  readonly followedId: string;
  readonly createdAt: Date;
}

export interface IProfileRepository {
  /** Create a follow edge; idempotent if it already exists. */
  follow(followerId: string, followedId: string): Promise<void>;
  /** Remove a follow edge; no-op if absent. */
  unfollow(followerId: string, followedId: string): Promise<void>;
  /** Whether `followerId` currently follows `followedId`. */
  isFollowing(followerId: string, followedId: string): Promise<boolean>;
  /** Ids of every user that `followerId` follows (used to build the feed). */
  listFollowedIds(followerId: string): Promise<ReadonlyArray<string>>;
}
