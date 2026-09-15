import { prisma } from '../lib/prisma';
import { User, Prisma } from '@prisma/client';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  bio?: string | null;
  image?: string | null;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

export class UserRepository {
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username }
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        bio: data.bio ?? null,
        image: data.image ?? null
      }
    });
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    const updateData: Prisma.UserUpdateInput = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.image !== undefined) updateData.image = data.image;

    return prisma.user.update({
      where: { id },
      data: updateData
    });
  }
}

export const userRepository = new UserRepository();
