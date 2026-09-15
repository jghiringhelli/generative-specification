import { PrismaClient } from '@prisma/client';
import {
  CreateUserRecord,
  IUserRepository,
  UpdateUserRecord,
  UserRecord,
} from './IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  public constructor(private readonly client: PrismaClient) {}

  public findById(id: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { id } });
  }

  public findByEmail(email: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { email } });
  }

  public findByUsername(username: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { username } });
  }

  public create(data: CreateUserRecord): Promise<UserRecord> {
    return this.client.user.create({ data });
  }

  public update(id: string, data: UpdateUserRecord): Promise<UserRecord> {
    return this.client.user.update({ where: { id }, data });
  }
}
