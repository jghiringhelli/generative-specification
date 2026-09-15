import { Prisma, PrismaClient, User } from "@prisma/client";
import { CreateUserData, UpdateUserData, UserRecord } from "./user.types";

export interface UserRepositoryPort {
  create(data: CreateUserData): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: number): Promise<UserRecord | null>;
  update(id: number, data: UpdateUserData): Promise<UserRecord>;
}

export class UserRepository implements UserRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Persists a new user. */
  public create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /** Finds a user by email address. */
  public findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Finds a user by identifier. */
  public findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Updates a persisted user. */
  public update(id: number, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: data as Prisma.UserUpdateInput
    });
  }
}
