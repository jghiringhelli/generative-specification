import { PrismaClient, Prisma } from '@prisma/client';
import type { UserProfile } from '../types/domain';
import type { IProfileRepository } from './IProfileRepository';
import { NotFoundError } from '../errors/AppError';

/** Prisma error code for record-not-found on update/delete. */
const PRISMA_NOT_FOUND = 'P2025';

/**
 * PostgreSQL-backed implementation of `IProfileRepository` via Prisma.
 *
 * All database I/O for profile and follow operations is confined to this adapter.
 * Domain services import `IProfileRepository` only — never this class directly.
 * Wire at the composition root (`src/server.ts`).
 */
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find a user's public profile by username, with optional follow status.
   *
   * @param username - The target user's username (case-sensitive)
   * @param currentUserId - Optional viewer ID for `following` computation
   * @returns The user's public profile, or null if no such user exists
   */
  async findByUsername(username: string, currentUserId?: number): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        bio: true,
        image: true,
        followers: currentUserId !== undefined
          ? { where: { followerId: currentUserId }, select: { followerId: true } }
          : false,
      },
    });

    if (!user) return null;

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: currentUserId !== undefined
        ? (user.followers as { followerId: number }[]).length > 0
        : false,
    };
  }

  /**
   * Create a follow relationship by username (idempotent — upsert semantics).
   *
   * @param followerId - ID of the user performing the follow
   * @param username - Username of the user to follow
   * @returns The followed user's profile with `following: true`
   * @throws `NotFoundError` if no user with that username exists
   */
  async follow(followerId: number, username: string): Promise<UserProfile> {
    const target = await this.findUserByUsername(username);

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId: target.id } },
      create: { followerId, followingId: target.id },
      update: {},
    });

    return { username: target.username, bio: target.bio, image: target.image, following: true };
  }

  /**
   * Remove a follow relationship by username (idempotent — no-op if not following).
   *
   * @param followerId - ID of the user removing the follow
   * @param username - Username of the user to unfollow
   * @returns The unfollowed user's profile with `following: false`
   * @throws `NotFoundError` if no user with that username exists
   */
  async unfollow(followerId: number, username: string): Promise<UserProfile> {
    const target = await this.findUserByUsername(username);

    try {
      await this.prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId: target.id } },
      });
    } catch (err) {
      // Idempotent: ignore P2025 — relationship already absent, treat as success
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_NOT_FOUND)) {
        throw err;
      }
    }

    return { username: target.username, bio: target.bio, image: target.image, following: false };
  }

  /**
   * Resolve a username to the minimal user record needed for follow operations.
   *
   * @param username - The username to look up
   * @returns User record with id, username, bio, image
   * @throws `NotFoundError` if no user with that username exists
   */
  private async findUserByUsername(
    username: string,
  ): Promise<{ id: number; username: string; bio: string | null; image: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true },
    });
    if (!user) throw new NotFoundError('profile');
    return user;
  }
}
