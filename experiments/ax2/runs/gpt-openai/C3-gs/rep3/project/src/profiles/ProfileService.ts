import { NotFoundError } from '../errors/AppError';
import {
  IProfileRepository,
  ProfileRecord,
} from '../repositories/IProfileRepository';

export interface Profile {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export class ProfileService {
  public constructor(private readonly profiles: IProfileRepository) {}

  /** Returns a public profile as viewed by an optional authenticated user. */
  public async get(
    username: string,
    viewerId?: string,
  ): Promise<Profile> {
    const profile = await this.requireProfile(username);
    return this.toProfile(profile, viewerId);
  }

  /** Follows a profile and returns its new representation. */
  public async follow(username: string, followerId: string): Promise<Profile> {
    const profile = await this.requireProfile(username);
    await this.profiles.follow(followerId, profile.id);
    return this.toProfile(profile, followerId);
  }

  /** Unfollows a profile and returns its new representation. */
  public async unfollow(username: string, followerId: string): Promise<Profile> {
    const profile = await this.requireProfile(username);
    await this.profiles.unfollow(followerId, profile.id);
    return this.toProfile(profile, followerId);
  }

  private async requireProfile(username: string): Promise<ProfileRecord> {
    const profile = await this.profiles.findByUsername(username);
    if (!profile) throw new NotFoundError(`Profile ${username} not found`);
    return profile;
  }

  private async toProfile(
    profile: ProfileRecord,
    viewerId?: string,
  ): Promise<Profile> {
    const following = viewerId
      ? await this.profiles.isFollowing(viewerId, profile.id)
      : false;
    return {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following,
    };
  }
}
