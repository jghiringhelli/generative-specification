import { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
} from './IUserRepository';

/**
 * Prisma-backed implementation of the user persistence port.
 */
export class UserRepository implements IUserRepository {
  /** @inheritdoc */
  create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  /** @inheritdoc */
  findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  /** @inheritdoc */
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /** @inheritdoc */
  findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  /** @inheritdoc */
  update(id: number, data: UpdateUserData): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }
}
