/**
 * Prisma-backed {@link IProfileRepository} — the production follow-graph adapter.
 *
 * Maps the directed follow edge to the `follows` table. `follow` upserts so it
 * is idempotent; `unfollow` uses `deleteMany` with a specific `WHERE` so it is a
 * no-op when the edge is absent (and never an unscoped delete).
 *
 * Exercised by the real-database integration test (auto-skipped when no
 * `DATABASE_URL` is reachable) and excluded from the unit-coverage denominator
 * in jest.config.js, since it is thin I/O verified against a real Postgres. Its
 * behavioural contract is covered identically by InMemoryProfileRepository.
 *
 * @gs-links: docs/specs/profiles.md, docs/adrs/ADR-0002-auth.md
 */
import type { PrismaClient } from '@prisma/client';
import type { IProfileRepository } from '../../repositories/IProfileRepository.js';

export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async follow(followerId: string, followedId: string): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followedId: { followerId, followedId } },
      create: { followerId, followedId },
      update: {},
    });
  }

  /** @inheritdoc */
  async unfollow(followerId: string, followedId: string): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followedId } });
  }

  /** @inheritdoc */
  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    const count = await this.prisma.follow.count({ where: { followerId, followedId } });
    return count > 0;
  }

  /** @inheritdoc */
  async listFollowedIds(followerId: string): Promise<ReadonlyArray<string>> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId },
      select: { followedId: true },
    });
    return rows.map((row) => row.followedId);
  }
}
