// src/repositories/IProfileRepository.ts
import { ProfileResponse } from '../types';

export interface IProfileRepository {
  findByUsername(username: string, currentUserId?: string): Promise<ProfileResponse | null>;
  followUser(followerId: string, usernameToFollow: string): Promise<ProfileResponse>;
  unfollowUser(followerId: string, usernameToUnfollow: string): Promise<ProfileResponse>;
  isFollowing(followerId: string, targetUserId: string): Promise<boolean>;
}
