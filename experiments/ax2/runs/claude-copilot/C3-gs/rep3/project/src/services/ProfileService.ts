import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { ProfileResponse } from '../types/responses';
import { User } from '../types/domain';
import { NotFoundError } from '../errors/AppError';

/** Orchestrates profile viewing and follow/unfollow operations. */
export class ProfileService {
  constructor(
    private readonly users: IUserRepository,
    private readonly follows: IProfileRepository,
  ) {}

  private toResponse(user: User, following: boolean): ProfileResponse {
    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following,
      },
    };
  }

  private async requireUser(username: string): Promise<User> {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile not found');
    }
    return user;
  }

  async getProfile(
    username: string,
    viewerId: number | null,
  ): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    const following =
      viewerId !== null
        ? await this.follows.isFollowing(viewerId, target.id)
        : false;
    return this.toResponse(target, following);
  }

  async follow(username: string, followerId: number): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    await this.follows.follow(followerId, target.id);
    return this.toResponse(target, true);
  }

  async unfollow(
    username: string,
    followerId: number,
  ): Promise<ProfileResponse> {
    const target = await this.requireUser(username);
    await this.follows.unfollow(followerId, target.id);
    return this.toResponse(target, false);
  }
}
