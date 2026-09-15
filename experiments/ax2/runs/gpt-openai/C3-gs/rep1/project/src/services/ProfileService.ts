import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type { IProfileRepository, ProfileRecord } from '../repositories/IProfileRepository';
import type { IUserRepository, UserRecord } from '../repositories/IUserRepository';

export class ProfileService {
  public constructor(
    private readonly profiles: IProfileRepository,
    private readonly users: IUserRepository,
  ) {}

  /** Returns a public profile from the viewer's perspective. */
  public async get(username: string, viewerId?: string): Promise<ProfileRecord> {
    const profile = await this.profiles.findByUsername(username, viewerId);
    if (!profile) throw new NotFoundError('Profile not found', { username });
    return profile;
  }

  /** Follows a profile as the authenticated user. */
  public async follow(username: string, followerId: string): Promise<ProfileRecord> {
    const target = await this.requireUser(username);
    if (target.id === followerId) throw new ForbiddenError('Users cannot follow themselves');
    await this.profiles.follow(followerId, target.id);
    return this.get(username, followerId);
  }

  /** Unfollows a profile as the authenticated user. */
  public async unfollow(username: string, followerId: string): Promise<ProfileRecord> {
    const target = await this.requireUser(username);
    await this.profiles.unfollow(followerId, target.id);
    return this.get(username, followerId);
  }

  private async requireUser(username: string): Promise<UserRecord> {
    const user = await this.users.findByUsername(username);
    if (!user) throw new NotFoundError('Profile not found', { username });
    return user;
  }
}
