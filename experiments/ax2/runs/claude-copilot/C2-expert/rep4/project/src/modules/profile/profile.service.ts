import { NotFoundError } from "../../lib/errors";
import { UserRepository } from "../user/user.repository";

/** The `profile` object returned by profile endpoints. */
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
  private readonly users: UserRepository;

  /**
   * @param users Injected user repository.
   */
  constructor(users: UserRepository) {
    this.users = users;
  }

  /**
   * Fetch a public profile by username.
   * @param username The profile owner's username.
   * @param currentUserId The viewer's id, when authenticated.
   * @returns The profile with the correct `following` flag.
   */
  async getProfile(
    username: string,
    currentUserId?: number,
  ): Promise<ProfileResponse> {
    const target = await this.users.findByUsername(username);
    if (!target) {
      throw new NotFoundError("profile not found");
    }
    const following = currentUserId
      ? await this.users.isFollowing(currentUserId, target.id)
      : false;
    return this.toResponse(username, target.bio, target.image, following);
  }

  /**
   * Follow a profile (idempotent).
   * @param username The profile to follow.
   * @param currentUserId The follower id.
   * @returns The profile with `following` set to true.
   */
  async follow(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponse> {
    const target = await this.users.findByUsername(username);
    if (!target) {
      throw new NotFoundError("profile not found");
    }
    await this.users.follow(currentUserId, target.id);
    return this.toResponse(username, target.bio, target.image, true);
  }

  /**
   * Unfollow a profile (idempotent).
   * @param username The profile to unfollow.
   * @param currentUserId The follower id.
   * @returns The profile with `following` set to false.
   */
  async unfollow(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponse> {
    const target = await this.users.findByUsername(username);
    if (!target) {
      throw new NotFoundError("profile not found");
    }
    await this.users.unfollow(currentUserId, target.id);
    return this.toResponse(username, target.bio, target.image, false);
  }

  /**
   * Assemble the profile response object.
   * @param username Profile username.
   * @param bio Profile bio.
   * @param image Profile image.
   * @param following Whether the viewer follows the profile.
   * @returns The profile response.
   */
  private toResponse(
    username: string,
    bio: string | null,
    image: string | null,
    following: boolean,
  ): ProfileResponse {
    return { profile: { username, bio, image, following } };
  }
}
