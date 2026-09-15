import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type {
  IProfileRepository,
  ProfileRecord,
} from '../repositories/IProfileRepository';

export interface ProfileResponse {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export class ProfileService {
  public constructor(private readonly profiles: IProfileRepository) {}

  /** Gets a public profile with viewer-specific following state. */
  public async get(username: string, viewerId?: string): Promise<ProfileResponse> {
    return this.toResponse(await this.requireProfile(username, viewerId));
  }

  /** Follows a profile and returns its updated representation. */
  public async follow(username: string, viewerId: string): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username, viewerId);
    if (profile.user.id === viewerId) {
      throw new ForbiddenError('Users cannot follow themselves');
    }
    await this.profiles.follow(viewerId, profile.user.id);
    return { ...this.toResponse(profile), following: true };
  }

  /** Unfollows a profile and returns its updated representation. */
  public async unfollow(username: string, viewerId: string): Promise<ProfileResponse> {
    const profile = await this.requireProfile(username, viewerId);
    await this.profiles.unfollow(viewerId, profile.user.id);
    return { ...this.toResponse(profile), following: false };
  }

  private async requireProfile(
    username: string,
    viewerId?: string,
  ): Promise<ProfileRecord> {
    const profile = await this.profiles.findByUsername(username, viewerId);
    if (!profile) {
      throw new NotFoundError(`Profile '${username}' was not found`);
    }
    return profile;
  }

  private toResponse(profile: ProfileRecord): ProfileResponse {
    return {
      username: profile.user.username,
      bio: profile.user.bio,
      image: profile.user.image,
      following: profile.following,
    };
  }
}
