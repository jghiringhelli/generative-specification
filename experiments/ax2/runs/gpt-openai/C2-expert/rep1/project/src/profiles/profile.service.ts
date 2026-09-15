import { NotFoundError } from "../errors/application-error";
import { UserRepositoryPort } from "../users/user.repository";
import { UserRecord } from "../users/user.types";
import { FollowRepositoryPort } from "./follow.repository";
import { ProfileResponse } from "./profile.types";

export class ProfileService {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly follows: FollowRepositoryPort
  ) {}

  /** Gets a profile and its relationship to the requesting user. */
  public async get(username: string, currentUserId?: number): Promise<ProfileResponse> {
    const profileUser = await this.requireProfile(username);
    return this.toResponse(
      profileUser,
      currentUserId
        ? await this.follows.isFollowing(currentUserId, profileUser.id)
        : false
    );
  }

  /** Idempotently follows a user and returns the updated profile. */
  public async follow(username: string, currentUserId: number): Promise<ProfileResponse> {
    const profileUser = await this.requireProfile(username);
    await this.follows.follow(currentUserId, profileUser.id);
    return this.toResponse(profileUser, true);
  }

  /** Idempotently unfollows a user and returns the updated profile. */
  public async unfollow(username: string, currentUserId: number): Promise<ProfileResponse> {
    const profileUser = await this.requireProfile(username);
    await this.follows.unfollow(currentUserId, profileUser.id);
    return this.toResponse(profileUser, false);
  }

  private async requireProfile(username: string): Promise<UserRecord> {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new NotFoundError("Profile does not exist");
    }
    return user;
  }

  private toResponse(user: UserRecord, following: boolean): ProfileResponse {
    return { username: user.username, bio: user.bio, image: user.image, following };
  }
}
