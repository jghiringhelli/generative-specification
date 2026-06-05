/**
 * In-memory {@link IProfileRepository}.
 *
 * A genuine working implementation (a Fake, not a mock) of the follow-graph
 * persistence port: directed follower → followed edges with idempotent insert
 * and no-op delete, matching the uniqueness the database enforces. Used as the
 * driven adapter in subcutaneous tests and for local development without a
 * database. Production wiring uses {@link PrismaProfileRepository}.
 *
 * @gs-links: docs/specs/profiles.md
 */
import type { IProfileRepository } from '../../repositories/IProfileRepository.js';

export class InMemoryProfileRepository implements IProfileRepository {
  /** followerId → (followedId → edge creation time). */
  private readonly edges = new Map<string, Map<string, Date>>();

  /** @inheritdoc */
  follow(followerId: string, followedId: string): Promise<void> {
    const followed = this.edges.get(followerId) ?? new Map<string, Date>();
    if (!followed.has(followedId)) {
      followed.set(followedId, new Date());
    }
    this.edges.set(followerId, followed);
    return Promise.resolve();
  }

  /** @inheritdoc */
  unfollow(followerId: string, followedId: string): Promise<void> {
    this.edges.get(followerId)?.delete(followedId);
    return Promise.resolve();
  }

  /** @inheritdoc */
  isFollowing(followerId: string, followedId: string): Promise<boolean> {
    return Promise.resolve(this.edges.get(followerId)?.has(followedId) ?? false);
  }

  /** @inheritdoc */
  listFollowedIds(followerId: string): Promise<ReadonlyArray<string>> {
    return Promise.resolve([...(this.edges.get(followerId)?.keys() ?? [])]);
  }
}
