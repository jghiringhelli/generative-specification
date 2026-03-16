import { PrismaClient } from '@prisma/client';
import {
  IUserRepository,
  User,
  CreateUserData,
  UpdateUserData
} from './IUserRepository';

/**
 * Prisma implementation of IUserRepository.
 * Single responsibility: translate User domain operations to Prisma ORM calls.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

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

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data
    });
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }
}
