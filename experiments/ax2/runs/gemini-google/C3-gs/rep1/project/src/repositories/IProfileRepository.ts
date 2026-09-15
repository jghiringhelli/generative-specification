// src/repositories/IProfileRepository.ts

export interface ProfileEntity {
  id: string;
  username: string;
  bio: string | null;
  image: string | null;
  following?: boolean;
}

export interface IProfileRepository {
  findByUsername(username: string): Promise<ProfileEntity | null>;
  follow(followerId: string, followingId: string): Promise<void>;
  unfollow(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
}
