import { ApplicationError } from '../errors/application-error';
import { ProfileRepository } from './repository';

export interface ProfileResponse {
  readonly profile: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

export class ProfileService {
  public constructor(private readonly profiles: ProfileRepository) {}

  /** Gets a public profile for an optional authenticated viewer. */
  public async get(username: string, viewerId?: number): Promise<ProfileResponse> {
    const record = await this.profiles.find(username, viewerId);
    if (!record) throw new ApplicationError('Profile not found', 404);
    return { profile: {
      username: record.user.username,
      bio: record.user.bio,
      image: record.user.image,
      following: record.following,
    } };
  }

  /** Follows a profile idempotently. */
  public async follow(username: string, viewerId: number): Promise<ProfileResponse> {
    const record = await this.profiles.find(username, viewerId);
    if (!record) throw new ApplicationError('Profile not found', 404);
    await this.profiles.follow(viewerId, record.user.id);
    return this.get(username, viewerId);
  }

  /** Unfollows a profile idempotently. */
  public async unfollow(username: string, viewerId: number): Promise<ProfileResponse> {
    const record = await this.profiles.find(username, viewerId);
    if (!record) throw new ApplicationError('Profile not found', 404);
    await this.profiles.unfollow(viewerId, record.user.id);
    return this.get(username, viewerId);
  }
}
