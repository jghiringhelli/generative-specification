import { PrismaClient, User } from '@prisma/client';

/** Fields accepted when creating a user. */
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

/** Mutable user fields accepted on update. */
export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * Persistence adapter for {@link User}. The only place `prisma.user` is touched.
 */
export class UserRepository {
  /** @param prisma injected Prisma client */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates a new user row.
   * @param data the user fields (password already hashed)
   * @returns the created user
   */
  create(data: CreateUserData & { password: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /**
   * Finds a user by email.
   * @param email the email to look up
   * @returns the user or null
   */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Finds a user by username.
   * @param username the username to look up
   * @returns the user or null
   */
  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /**
   * Finds a user by primary key.
   * @param id the user id
   * @returns the user or null
   */
  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Updates a user row.
   * @param id the user id
   * @param data the mutable fields to apply
   * @returns the updated user
   */
  update(id: number, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
