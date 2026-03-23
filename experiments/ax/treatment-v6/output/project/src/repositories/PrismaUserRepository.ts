import type { PrismaClient } from '@prisma/client';
import type {
  IUserRepository,
  User,
  CreateUserData,
  UpdateUserData,
} from './IUserRepository.js';

/**
 * Prisma-backed implementation of IUserRepository.
 * §9 check: implements findByEmail, findByUsername, findById, create, update.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ?? null;
  }

  /** @inheritdoc */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return user ?? null;
  }

  /** @inheritdoc */
  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ?? null;
  }

  /** @inheritdoc */
  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
    });
  }

  /** @inheritdoc */
  async update(id: number, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.image !== undefined && { image: data.image }),
      },
    });
  }
}
