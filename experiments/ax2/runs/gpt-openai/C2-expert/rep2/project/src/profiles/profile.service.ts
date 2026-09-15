import { ProfileNotFoundError } from './profile.errors';
import { ProfileRepositoryPort } from './profile.repository';
import { ProfileRecord, ProfileResponse } from './profile.types';

export class ProfileService {
  public constructor(private readonly profiles: ProfileRepositoryPort) {}

  /** Gets a public profile with its relationship to the requesting user. */
  public async get(username: string, currentUserId?: number): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    return this.toResponse(profile, await this.getFollowing(currentUserId, profile.id));
  }

  /** Follows a profile idempotently. */
  public async follow(username: string, currentUserId: number): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    await this.profiles.follow(currentUserId, profile.id);
    return this.toResponse(profile, true);
  }

  /** Unfollows a profile idempotently. */
  public async unfollow(username: string, currentUserId: number): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    await this.profiles.unfollow(currentUserId, profile.id);
    return this.toResponse(profile, false);
  }

  private async requireProfile(username: string): Promise<ProfileRecord> {
    const profile = await this.profiles.findByUsername(username);
    if (!profile) throw new ProfileNotFoundError(username);
    return profile;
  }

  private getFollowing(currentUserId: number | undefined, profileId: number): Promise<boolean> {
    if (currentUserId === undefined) return Promise.resolve(false);
    return this.profiles.isFollowing(currentUserId, profileId);
  }

  private toResponse(profile: ProfileRecord, following: boolean): ProfileResponse {
    return { username: profile.username, bio: profile.bio, image: profile.image, following };
  }
}
