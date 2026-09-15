import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { UserRecord } from '../repositories/IUserRepository';

export interface Profile {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export class ProfileService {
  public constructor(private readonly profiles: IProfileRepository) {}

  public async get(username: string, viewerId?: string): Promise<Profile> {
    const target = await this.requireProfile(username);
    return this.toProfile(target, viewerId);
  }

  public async follow(username: string, followerId: string): Promise<Profile> {
    const target = await this.requireProfile(username);
    if (target.id === followerId) throw new ForbiddenError('Users cannot follow themselves');
    await this.profiles.follow(followerId, target.id);
    return this.toProfile(target, followerId);
  }

  public async unfollow(username: string, followerId: string): Promise<Profile> {
    const target = await this.requireProfile(username);
    await this.profiles.unfollow(followerId, target.id);
    return this.toProfile(target, followerId);
  }

  private async requireProfile(username: string): Promise<UserRecord> {
    const profile = await this.profiles.findByUsername(username);
    if (!profile) throw new NotFoundError(`Profile '${username}' was not found`);
    return profile;
  }

  private async toProfile(target: UserRecord, viewerId?: string): Promise<Profile> {
    const following = viewerId ? await this.profiles.isFollowing(viewerId, target.id) : false;
    return { username: target.username, bio: target.bio, image: target.image, following };
  }
}
