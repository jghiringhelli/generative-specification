import { PrismaClient } from '@prisma/client';
import { IUserRepository } from './IUserRepository';
import { CreateUserInput, UpdateUserInput, User } from '../domain/types';

/**
 * Prisma-backed driven adapter implementing {@link IUserRepository}.
 */
export class PrismaUserRepository implements IUserRepository {
  private readonly prisma: PrismaClient;

  /**
   * @param prisma - Injected Prisma client.
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /** @inheritdoc */
  async create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({ data: input });
  }

  /** @inheritdoc */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** @inheritdoc */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** @inheritdoc */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /** @inheritdoc */
  async update(id: number, input: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: input });
  }
}
