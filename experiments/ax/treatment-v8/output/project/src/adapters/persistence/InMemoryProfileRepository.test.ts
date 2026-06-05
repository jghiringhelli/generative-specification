/**
 * Unit tests for {@link InMemoryProfileRepository}.
 *
 * Verifies the follow-graph fake honours the {@link IProfileRepository} contract
 * — idempotent follow, no-op unfollow, directed edges — so it is a faithful
 * stand-in for the Prisma adapter in subcutaneous tests.
 *
 * @gs-links: docs/specs/profiles.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { InMemoryProfileRepository } from './InMemoryProfileRepository.js';

const ALICE = 'alice-id';
const BOB = 'bob-id';
const CAROL = 'carol-id';

describe('InMemoryProfileRepository', () => {
  let repo: InMemoryProfileRepository;
  beforeEach(() => {
    repo = new InMemoryProfileRepository();
  });

  it('records a follow edge that isFollowing then reports', async () => {
    await repo.follow(ALICE, BOB);
    expect(await repo.isFollowing(ALICE, BOB)).toBe(true);
  });

  it('treats follow as idempotent — a repeated follow adds no second edge', async () => {
    await repo.follow(ALICE, BOB);
    await repo.follow(ALICE, BOB);
    expect(await repo.listFollowedIds(ALICE)).toEqual([BOB]);
  });

  it('removes the edge on unfollow', async () => {
    await repo.follow(ALICE, BOB);
    await repo.unfollow(ALICE, BOB);
    expect(await repo.isFollowing(ALICE, BOB)).toBe(false);
  });

  it('treats unfollow of an absent edge as a no-op', async () => {
    await expect(repo.unfollow(ALICE, BOB)).resolves.toBeUndefined();
    expect(await repo.isFollowing(ALICE, BOB)).toBe(false);
  });

  it('edges are directed — B following A is not A following B', async () => {
    await repo.follow(BOB, ALICE);
    expect(await repo.isFollowing(ALICE, BOB)).toBe(false);
  });

  it('lists every id a follower follows, and is empty for an unknown follower', async () => {
    await repo.follow(ALICE, BOB);
    await repo.follow(ALICE, CAROL);
    expect([...(await repo.listFollowedIds(ALICE))].sort()).toEqual([BOB, CAROL].sort());
    expect(await repo.listFollowedIds(CAROL)).toEqual([]);
  });

  it('reports isFollowing=false for a follower with no edges', async () => {
    expect(await repo.isFollowing(CAROL, BOB)).toBe(false);
  });
});
