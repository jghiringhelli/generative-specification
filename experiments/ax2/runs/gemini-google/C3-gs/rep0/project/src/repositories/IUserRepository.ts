// src/repositories/IUserRepository.ts
import { User } from '../types';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  bio?: string | null;
  image?: string | null;
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
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User>;
  existsByEmailOrUsername(email: string, username: string, excludeId?: string): Promise<{ emailExists: boolean; usernameExists: boolean }>;
}
