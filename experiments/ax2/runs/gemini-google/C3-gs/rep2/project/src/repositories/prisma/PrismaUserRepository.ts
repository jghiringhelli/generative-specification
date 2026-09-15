import { PrismaClient } from '@prisma/client';
import { IUserRepository, UserEntity, CreateUserData, UpdateUserData } from '../IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Retrieves a user by primary key ID.
   */
  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Retrieves a user by unique email address.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Retrieves a user by unique username.
   */
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /**
   * Persists a new user record in PostgreSQL.
   */
  async create(data: CreateUserData): Promise<UserEntity> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        bio: data.bio ?? null,
        image: data.image ?? null,
      },
    });
  }

  /**
   * Updates fields of an existing user record.
   */
  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        bio: data.bio,
        image: data.image,
      },
    });
  }
}
