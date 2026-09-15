// src/repositories/UserRepository.ts
import { PrismaClient } from '@prisma/client';
import { IUserRepository, CreateUserData, UpdateUserData } from './IUserRepository';
import { User } from '../types';
import { prisma as defaultPrisma } from '../prisma';

export class UserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        bio: data.bio ?? null,
        image: data.image ?? null
      }
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

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.password !== undefined && { password: data.password }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.image !== undefined && { image: data.image })
      }
    });
  }

  async existsByEmailOrUsername(
    email: string,
    username: string,
    excludeId?: string
  ): Promise<{ emailExists: boolean; usernameExists: boolean }> {
    const existing = await this.prisma.user.findMany({
      where: {
        OR: [{ email }, { username }],
        ...(excludeId ? { NOT: { id: excludeId } } : {})
      },
      select: { email: true, username: true }
    });

    const emailExists = existing.some(u => u.email.toLowerCase() === email.toLowerCase());
    const usernameExists = existing.some(u => u.username.toLowerCase() === username.toLowerCase());

    return { emailExists, usernameExists };
  }
}
