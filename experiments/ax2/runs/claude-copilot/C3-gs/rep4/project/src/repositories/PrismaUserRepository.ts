import { PrismaClient } from '@prisma/client';
import { IUserRepository } from './IUserRepository';
import { CreateUserData, UpdateUserData, UserEntity } from '../domain/entities';

/**
 * Prisma-backed driven adapter implementing {@link IUserRepository}.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<UserEntity> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
