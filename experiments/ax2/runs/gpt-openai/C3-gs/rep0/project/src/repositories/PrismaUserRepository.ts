import { PrismaClient } from '@prisma/client';
import {
  CreateUserRecord,
  IUserRepository,
  UpdateUserRecord,
  UserRecord,
} from './IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  public constructor(private readonly database: PrismaClient) {}

  public findById(id: string): Promise<UserRecord | null> {
    return this.database.user.findUnique({ where: { id } });
  }

  public findByEmail(email: string): Promise<UserRecord | null> {
    return this.database.user.findUnique({ where: { email } });
  }

  public findByUsername(username: string): Promise<UserRecord | null> {
    return this.database.user.findUnique({ where: { username } });
  }

  public create(input: CreateUserRecord): Promise<UserRecord> {
    return this.database.user.create({ data: input });
  }

  public update(id: string, input: UpdateUserRecord): Promise<UserRecord> {
    return this.database.user.update({ where: { id }, data: input });
  }
}
