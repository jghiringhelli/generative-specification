/**
 * Prisma-backed {@link IUserRepository} — the production persistence adapter.
 *
 * Maps the Prisma `User` row to the domain {@link User} and back. The domain
 * type and the persistence row happen to share field names today, but this
 * mapping is the seam that keeps the domain ignorant of Prisma.
 *
 * Exercised by the real-database integration test (auto-skipped when no
 * `DATABASE_URL` is reachable) and excluded from the unit-coverage denominator
 * in jest.config.js, since it is thin I/O verified against a real Postgres.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md, docs/adrs/ADR-0001-stack.md
 */
import type { PrismaClient, User as UserRow } from '@prisma/client';
import type {
  IUserRepository,
  NewUser,
  User,
  UserUpdate,
} from '../../repositories/IUserRepository.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async create(input: NewUser): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash: input.passwordHash,
      },
    });
    return this.toDomain(row);
  }

  /** @inheritdoc */
  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  /** @inheritdoc */
  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  /** @inheritdoc */
  async findByUsername(username: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { username } });
    return row ? this.toDomain(row) : null;
  }

  /** @inheritdoc */
  async update(id: string, changes: UserUpdate): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        ...(changes.email !== undefined ? { email: changes.email } : {}),
        ...(changes.username !== undefined ? { username: changes.username } : {}),
        ...(changes.bio !== undefined ? { bio: changes.bio } : {}),
        ...(changes.image !== undefined ? { image: changes.image } : {}),
        ...(changes.passwordHash !== undefined ? { passwordHash: changes.passwordHash } : {}),
      },
    });
    return this.toDomain(row);
  }

  /** @inheritdoc */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  /** @inheritdoc */
  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { username } });
    return count > 0;
  }

  /** Map a persistence row to the domain entity. */
  private toDomain(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      bio: row.bio,
      image: row.image,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
