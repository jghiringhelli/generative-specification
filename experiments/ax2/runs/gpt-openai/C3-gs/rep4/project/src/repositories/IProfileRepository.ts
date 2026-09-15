import type { User } from '@prisma/client';

export interface ProfileRecord {
  readonly user: User;
  readonly following: boolean;
}

export interface IProfileRepository {
  findByUsername(username: string, viewerId?: string): Promise<ProfileRecord | null>;
  follow(followerId: string, followedId: string): Promise<void>;
  unfollow(followerId: string, followedId: string): Promise<void>;
}
