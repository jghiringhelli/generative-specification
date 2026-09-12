import { User } from '../entities/User';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: number, data: UpdateUserData): Promise<User>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  follow(followerId: number, followingId: number): Promise<void>;
  unfollow(followerId: number, followingId: number): Promise<void>;
  getFollowingIds(userId: number): Promise<number[]>;
}
