import { IUserRepository, CreateUserData, UpdateUserData } from './IUserRepository';
import { UserEntity } from '../types';
import { prisma } from '../prisma';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    if (!user) return null;
    return this.mapToEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (!user) return null;
    return this.mapToEntity(user);
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    if (!user) return null;
    return this.mapToEntity(user);
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const created = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        username: data.username,
        passwordHash: data.passwordHash,
        bio: data.bio ?? '',
        image: data.image ?? ''
      }
    });
    return this.mapToEntity(created);
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const updateData: {
      email?: string;
      username?: string;
      passwordHash?: string;
      bio?: string;
      image?: string;
    } = {};

    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.username !== undefined) updateData.username = data.username;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
    if (data.bio !== undefined) updateData.bio = data.bio ?? '';
    if (data.image !== undefined) updateData.image = data.image ?? '';

    const updated = await prisma.user.update({
      where: { id },
      data: updateData
    });
    return this.mapToEntity(updated);
  }

  private mapToEntity(record: {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    bio: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return {
      id: record.id,
      email: record.email,
      username: record.username,
      passwordHash: record.passwordHash,
      bio: record.bio ?? '',
      image: record.image ?? '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
