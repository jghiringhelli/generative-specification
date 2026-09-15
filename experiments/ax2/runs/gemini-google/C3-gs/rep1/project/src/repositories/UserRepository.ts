import { PrismaClient } from '@prisma/client';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from './IUserRepository';
import { prisma as defaultPrisma } from '../config/prisma';

export class UserRepository implements IUserRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.db.user.findUnique({
      where: { username },
    });
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    return this.db.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        bio: data.bio ?? '',
        image: data.image ?? '',
      },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    return this.db.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.image !== undefined && { image: data.image }),
      },
    });
  }
}
