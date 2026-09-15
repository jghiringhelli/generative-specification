import { Prisma, PrismaClient } from '@prisma/client';
import { CreateUserData, UpdateUserData, UserRecord } from './user.types';

export interface UserRepositoryPort {
  create(data: CreateUserData): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: number): Promise<UserRecord | null>;
  update(id: number, data: UpdateUserData): Promise<UserRecord>;
}

export class UserRepository implements UserRepositoryPort {
  public constructor(private readonly database: PrismaClient) {}

  public create(data: CreateUserData): Promise<UserRecord> {
    return this.database.user.create({ data });
  }

  public findByEmail(email: string): Promise<UserRecord | null> {
    return this.database.user.findUnique({ where: { email } });
  }

  public findById(id: number): Promise<UserRecord | null> {
    return this.database.user.findUnique({ where: { id } });
  }

  public update(id: number, data: UpdateUserData): Promise<UserRecord> {
    return this.database.user.update({ where: { id }, data: data as Prisma.UserUpdateInput });
  }
}
