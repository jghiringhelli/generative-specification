import type { User } from '@prisma/client';

export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
}

export interface UpdateUserData {
  readonly email?: string;
  readonly username?: string;
  readonly passwordHash?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User>;
}
