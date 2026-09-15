import { Prisma, PrismaClient } from '@prisma/client';
import { ValidationError } from '../errors/AppError';
import type {
  CreateUserRecord,
  IUserRepository,
  UpdateUserRecord,
  UserRecord,
} from './IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Finds a user by immutable identifier. */
  public findById(id: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { id } });
  }

  /** Finds a user by email address. */
  public findByEmail(email: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { email } });
  }

  /** Finds a user by public username. */
  public findByUsername(username: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({ where: { username } });
  }

  /** Persists a new user. */
  public async create(data: CreateUserRecord): Promise<UserRecord> {
    try {
      return await this.client.user.create({ data });
    } catch (error) {
      this.rethrowUniqueConstraint(error);
    }
  }

  /** Updates mutable user fields. */
  public async update(id: string, data: UpdateUserRecord): Promise<UserRecord> {
    try {
      return await this.client.user.update({ where: { id }, data });
    } catch (error) {
      this.rethrowUniqueConstraint(error);
    }
  }

  private rethrowUniqueConstraint(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ValidationError('Email or username is already in use');
    }
    throw error;
  }
}
