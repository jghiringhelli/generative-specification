import { PrismaClient } from '@prisma/client';
import { IUserRepository } from './IUserRepository';
import { CreateUserInput, UpdateUserInput, User } from '../types/domain';

/** PrismaClient-backed implementation of {@link IUserRepository}. */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({ data: input });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async update(id: number, input: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: input });
  }
}
