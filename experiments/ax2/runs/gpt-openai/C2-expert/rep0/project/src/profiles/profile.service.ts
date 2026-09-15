import { NotFoundError, ValidationError } from "../errors";
import { ProfileRepositoryPort } from "./profile.repository";
import { ProfileRecord, ProfileResponse } from "./profile.types";

export class ProfileService {
  public constructor(private readonly profiles: ProfileRepositoryPort) {}

  /** Returns a profile with its relationship to the current user. */
  public async get(username: string, currentUserId?: number): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    return this.toResponse(profile, await this.following(currentUserId, profile.id));
  }

  /** Follows a profile and returns its updated representation. */
  public async follow(username: string, currentUserId: number): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    if (profile.id === currentUserId) {
      throw new ValidationError("users cannot follow themselves");
    }
    await this.profiles.follow(currentUserId, profile.id);
    return this.toResponse(profile, true);
  }

  /** Unfollows a profile and returns its updated representation. */
  public async unfollow(username: string, currentUserId: number): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    await this.profiles.unfollow(currentUserId, profile.id);
    return this.toResponse(profile, false);
  }

  private async requireProfile(username: string): Promise<ProfileRecord> {
    const profile = await this.profiles.findByUsername(username);
    if (!profile) {
      throw new NotFoundError("Profile not found");
    }
    return profile;
  }

  private following(currentUserId: number | undefined, profileId: number): Promise<boolean> {
    return currentUserId === undefined
      ? Promise.resolve(false)
      : this.profiles.isFollowing(currentUserId, profileId);
  }

  private toResponse(profile: ProfileRecord, following: boolean): ProfileResponse {
    return { username: profile.username, bio: profile.bio, image: profile.image, following };
  }
}
