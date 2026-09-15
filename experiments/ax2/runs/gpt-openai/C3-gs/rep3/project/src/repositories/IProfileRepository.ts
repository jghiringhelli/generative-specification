export interface ProfileRecord {
  readonly id: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export interface IProfileRepository {
  findByUsername(username: string): Promise<ProfileRecord | null>;
  isFollowing(followerId: string, followedId: string): Promise<boolean>;
  follow(followerId: string, followedId: string): Promise<void>;
  unfollow(followerId: string, followedId: string): Promise<void>;
}
