import { UserRecord } from './IUserRepository';

export interface IProfileRepository {
  findByUsername(username: string): Promise<UserRecord | null>;
  isFollowing(followerId: string, followedId: string): Promise<boolean>;
  follow(followerId: string, followedId: string): Promise<void>;
  unfollow(followerId: string, followedId: string): Promise<void>;
}
