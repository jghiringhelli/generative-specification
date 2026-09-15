// src/repositories/IProfileRepository.ts

export interface ProfileRecord {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface IProfileRepository {
  findByUsername(username: string, currentUserId?: string): Promise<ProfileRecord | null>;
  follow(followerId: string, username: string): Promise<ProfileRecord>;
  unfollow(followerId: string, username: string): Promise<ProfileRecord>;
  isFollowing(followerId: string, targetUserId: string): Promise<boolean>;
}
