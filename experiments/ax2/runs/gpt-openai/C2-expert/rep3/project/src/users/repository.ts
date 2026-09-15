import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';

export type UserUpdate = Partial<Pick<User, 'email' | 'username' | 'password' | 'bio' | 'image'>>;

export class UserRepository {
  /** Creates a user. */
  public create(data: Pick<User, 'email' | 'username' | 'password'>): Promise<User> {
    return prisma.user.create({ data });
  }

  /** Finds a user by email. */
  public findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /** Finds a user by username. */
  public findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  /** Finds a user by id. */
  public findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  /** Updates a user by id. */
  public update(id: number, data: UserUpdate): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }
}
