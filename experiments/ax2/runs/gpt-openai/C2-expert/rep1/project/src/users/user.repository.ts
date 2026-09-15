import { PrismaClient, User } from "@prisma/client";
import { CreateUserData, UpdateUserData, UserRecord } from "./user.types";

export interface UserRepositoryPort {
  findById(id: number): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  create(data: CreateUserData): Promise<UserRecord>;
  update(id: number, data: UpdateUserData): Promise<UserRecord>;
}

export class UserRepository implements UserRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Finds a user by primary key. */
  public findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Finds a user by email address. */
  public findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Finds a user by username. */
  public findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /** Persists a new user. */
  public create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /** Updates an existing user. */
  public update(id: number, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
