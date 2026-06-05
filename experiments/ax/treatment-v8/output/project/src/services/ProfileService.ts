/**
 * Application service for public profiles and the follow graph.
 *
 * A profile is a projection of a {@link User} plus the viewing user's follow
 * relationship. The service resolves a username to a user via
 * {@link IUserRepository} and reads/writes follow edges via
 * {@link IProfileRepository}; it contains no HTTP or framework concerns and
 * throws {@link AppError} subclasses the boundary maps to status codes.
 *
 * @gs-links: docs/specs/profiles.md, docs/use-cases.md
 */
import { NotFoundError } from '../errors/AppError.js';
import type { IProfileRepository } from '../repositories/IProfileRepository.js';
import type { IUserRepository, User } from '../repositories/IUserRepository.js';

/** The RealWorld profile projection: a user as seen by a (possibly anonymous) viewer. */
export interface Profile {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  /** Whether the viewing user follows this profile (`false` when anonymous). */
  readonly following: boolean;
}

export class ProfileService {
  constructor(
    private readonly users: IUserRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  /**
   * Fetch a public profile, reflecting the viewer's follow state when known.
   *
   * @param username - the target profile's username.
   * @param viewerId - the authenticated viewer's id, or undefined when anonymous.
   * @throws NotFoundError if no user has that username.
   */
  async getProfile(username: string, viewerId?: string): Promise<Profile> {
    const target = await this.requireUser(username);
    const following =
      viewerId !== undefined ? await this.profiles.isFollowing(viewerId, target.id) : false;
    return toProfile(target, following);
  }

  /**
   * Follow the target on behalf of the authenticated user (idempotent).
   *
   * @throws NotFoundError if the target username does not exist.
   */
  async follow(username: string, followerId: string): Promise<Profile> {
    const target = await this.requireUser(username);
    await this.profiles.follow(followerId, target.id);
    return toProfile(target, true);
  }

  /**
   * Unfollow the target on behalf of the authenticated user (idempotent).
   *
   * @throws NotFoundError if the target username does not exist.
   */
  async unfollow(username: string, followerId: string): Promise<Profile> {
    const target = await this.requireUser(username);
    await this.profiles.unfollow(followerId, target.id);
    return toProfile(target, false);
  }

  /** Resolve a username to a user, or throw a 404-mapping NotFoundError. */
  private async requireUser(username: string): Promise<User> {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile', username);
    }
    return user;
  }
}

/** Project a user plus a follow flag into the profile shape. */
function toProfile(user: User, following: boolean): Profile {
  return { username: user.username, bio: user.bio, image: user.image, following };
}
