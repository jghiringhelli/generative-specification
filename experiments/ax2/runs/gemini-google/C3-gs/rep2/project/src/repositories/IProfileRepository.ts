export interface ProfileEntity {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface IProfileRepository {
  getProfile(username: string, currentUserId?: string): Promise<ProfileEntity | null>;
  follow(followerId: string, usernameToFollow: string): Promise<ProfileEntity>;
  unfollow(followerId: string, usernameToUnfollow: string): Promise<ProfileEntity>;
}
