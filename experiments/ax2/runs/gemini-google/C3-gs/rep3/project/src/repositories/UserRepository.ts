// src/repositories/UserRepository.ts
import { PrismaClient } from '@prisma/client';
import { IUserRepository, UserEntity, CreateUserData, UpdateUserData } from './IUserRepository';

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    return user;
  }

  public async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { username }
    });
    return user;
  }

  public async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        bio: data.bio ?? null,
        image: data.image ?? null
      }
    });
    return user;
  }

  public async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.image !== undefined && { image: data.image })
      }
    });
    return user;
  }
}
