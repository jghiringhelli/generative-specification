import { PrismaClient, User } from '@prisma/client';
import { UpdateUserDTO } from '../types/user.types';

/**
 * User repository interface.
 * Defines the contract for user data access.
 */
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User>;
  update(id: number, data: UpdateUserDTO & { passwordHash?: string }): Promise<User>;
}

/**
 * Prisma implementation of user repository.
 */
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username }
    });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data
    });
  }

  async update(
    id: number,
    data: UpdateUserDTO & { passwordHash?: string }
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }
}
