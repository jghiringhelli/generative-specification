export interface ProfileRecord {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export interface IProfileRepository {
  findByUsername(username: string, viewerId?: string): Promise<ProfileRecord | null>;
  follow(followerId: string, followedId: string): Promise<void>;
  unfollow(followerId: string, followedId: string): Promise<void>;
}
