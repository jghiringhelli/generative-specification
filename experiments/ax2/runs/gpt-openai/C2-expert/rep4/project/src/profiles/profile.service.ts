import { User } from "@prisma/client";
import { NotFoundError, ValidationError } from "../errors";
import { IProfileRepository } from "./profile.repository";

export interface ProfileResponse {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export class ProfileService {
  public constructor(private readonly profiles: IProfileRepository) {}

  public async get(username: string, viewerId?: number): Promise<ProfileResponse> {
    const user = await this.findUser(username);
    return this.toResponse(user, await this.following(viewerId, user.id));
  }

  public async follow(username: string, followerId: number): Promise<ProfileResponse> {
    const user = await this.findUser(username);
    if (user.id === followerId) {
      throw new ValidationError("A user cannot follow themselves");
    }
    await this.profiles.follow(followerId, user.id);
    return this.toResponse(user, true);
  }

  public async unfollow(username: string, followerId: number): Promise<ProfileResponse> {
    const user = await this.findUser(username);
    await this.profiles.unfollow(followerId, user.id);
    return this.toResponse(user, false);
  }

  private async findUser(username: string): Promise<User> {
    const user = await this.profiles.findUser(username);
    if (!user) {
      throw new NotFoundError("Profile not found");
    }
    return user;
  }

  private following(viewerId: number | undefined, profileId: number): Promise<boolean> {
    return viewerId ? this.profiles.isFollowing(viewerId, profileId) : Promise.resolve(false);
  }

  private toResponse(user: User, following: boolean): ProfileResponse {
    return { username: user.username, bio: user.bio, image: user.image, following };
  }
}
