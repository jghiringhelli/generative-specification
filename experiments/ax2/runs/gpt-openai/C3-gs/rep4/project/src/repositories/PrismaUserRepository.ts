import type { PrismaClient, User } from '@prisma/client';
import type {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
} from './IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  public constructor(private readonly database: PrismaClient) {}

  /** Creates a user. */
  public create(data: CreateUserData): Promise<User> {
    return this.database.user.create({ data });
  }

  /** Finds a user by identifier. */
  public findById(id: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { id } });
  }

  /** Finds a user by email address. */
  public findByEmail(email: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { email } });
  }

  /** Finds a user by username. */
  public findByUsername(username: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { username } });
  }

  /** Updates a user. */
  public update(id: string, data: UpdateUserData): Promise<User> {
    return this.database.user.update({ where: { id }, data });
  }
}
