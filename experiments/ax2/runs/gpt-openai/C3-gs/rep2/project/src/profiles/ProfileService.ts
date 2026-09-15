import { NotFoundError, ValidationError } from '../errors/AppError';
import { IProfileRepository, ProfileRecord } from '../repositories/IProfileRepository';
import { ProfileResponse } from './contracts';

export class ProfileService {
  public constructor(private readonly profiles: IProfileRepository) {}

  /** Gets a profile as viewed by an optional authenticated user. */
  public async getProfile(username: string, viewerId?: string): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    return this.toResponse(profile, await this.following(viewerId, profile.id));
  }

  /** Follows a profile and returns its new representation. */
  public async follow(username: string, followerId: string): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    if (profile.id === followerId) {
      throw new ValidationError('Users cannot follow themselves');
    }
    await this.profiles.follow(followerId, profile.id);
    return this.toResponse(profile, true);
  }

  /** Unfollows a profile and returns its new representation. */
  public async unfollow(username: string, followerId: string): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username);
    await this.profiles.unfollow(followerId, profile.id);
    return this.toResponse(profile, false);
  }

  private async requireProfile(username: string): Promise<ProfileRecord> {
    const profile = await this.profiles.findByUsername(username);
    if (!profile) {
      throw new NotFoundError('Profile not found', { username });
    }
    return profile;
  }

  private async following(viewerId: string | undefined, profileId: string): Promise<boolean> {
    return viewerId ? this.profiles.isFollowing(viewerId, profileId) : false;
  }

  private toResponse(profile: ProfileRecord, following: boolean): ProfileResponse {
    return {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following,
    };
  }
}
