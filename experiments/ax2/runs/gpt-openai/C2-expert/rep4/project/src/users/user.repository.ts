import { Prisma, PrismaClient, User } from "@prisma/client";

export interface IUserRepository {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  update(id: number, data: Prisma.UserUpdateInput): Promise<User>;
}

export class UserRepository implements IUserRepository {
  public constructor(private readonly database: PrismaClient) {}

  public create(data: Prisma.UserCreateInput): Promise<User> {
    return this.database.user.create({ data });
  }

  public findByEmail(email: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { email } });
  }

  public findById(id: number): Promise<User | null> {
    return this.database.user.findUnique({ where: { id } });
  }

  public update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.database.user.update({ where: { id }, data });
  }
}
