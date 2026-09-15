import { PrismaClient, User } from '@prisma/client';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserRecord,
} from './IUserRepository';

function toUserRecord(user: User): UserRecord {
  return user;
}

export class PrismaUserRepository implements IUserRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Persists a new user. */
  public async create(data: CreateUserData): Promise<UserRecord> {
    return toUserRecord(await this.client.user.create({ data }));
  }

  /** Finds a user by immutable ID. */
  public async findById(id: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { id } });
  }

  /** Finds a user by email address. */
  public async findByEmail(email: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { email } });
  }

  /** Finds a user by public username. */
  public async findByUsername(username: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { username } });
  }

  /** Updates mutable user fields. */
  public async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    return toUserRecord(await this.client.user.update({ where: { id }, data }));
  }
}
