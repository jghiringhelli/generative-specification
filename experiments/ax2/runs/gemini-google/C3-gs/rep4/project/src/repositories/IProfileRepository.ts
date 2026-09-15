import { UserEntity } from '../types';

export interface ProfileData {
  user: UserEntity;
  following: boolean;
}

export interface IProfileRepository {
  findProfile(username: string, currentUserId?: string): Promise<ProfileData | null>;
  follow(followerId: string, followingUsername: string): Promise<ProfileData>;
  unfollow(followerId: string, followingUsername: string): Promise<ProfileData>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
}
