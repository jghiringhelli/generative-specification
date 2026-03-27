import type { Comment } from '../types/domain';
import type { ICommentRepository } from './ICommentRepository';
import type { IUserRepository } from './IUserRepository';
import { NotFoundError } from '../errors/AppError';

/**
 * In-memory implementation of `ICommentRepository` for unit tests.
 *
 * Two modes:
 *   1. Standalone (no userRepo): `create()` stubs the author as `'stub-author'`.
 *      Sufficient for service-level unit tests that verify comment logic, not author names.
 *   2. Shared (userRepo injected): `create()` looks up the real author by `authorId`.
 *      Required for route-level integration tests that assert `comment.author.username`.
 *
 * Comments are indexed by ID (for findById/delete) and by article slug
 * (for findByArticleSlug/create). The `articleId` field is set to 0 for
 * in-memory records — no real article store exists here.
 *
 * Use `seed()` to pre-populate and `clear()` between test cases.
 */
export class InMemoryCommentRepository implements ICommentRepository {
  /** All comments indexed by their ID for O(1) lookup. */
  private readonly commentsById: Map<number, Comment> = new Map();
  /** Comments grouped by article slug for O(1) article-scoped queries. */
  private readonly commentsBySlug: Map<string, Comment[]> = new Map();
  private nextId = 1;

  constructor(private readonly userRepo?: IUserRepository) {}

  /**
   * Pre-populate the repository with existing comments grouped by article slug.
   * Clears current state before seeding.
   *
   * @param bySlug - Record mapping article slug → array of comments
   */
  seed(bySlug: Record<string, Comment[]>): void {
    this.commentsById.clear();
    this.commentsBySlug.clear();
    this.nextId = 1;
    for (const [slug, comments] of Object.entries(bySlug)) {
      const cloned = comments.map((c) => ({ ...c }));
      this.commentsBySlug.set(slug, cloned);
      for (const comment of cloned) {
        this.commentsById.set(comment.id, comment);
        if (comment.id >= this.nextId) this.nextId = comment.id + 1;
      }
    }
  }

  /** Remove all comments. */
  clear(): void {
    this.commentsById.clear();
    this.commentsBySlug.clear();
    this.nextId = 1;
  }

  /** @inheritdoc */
  async findById(id: number): Promise<Comment | null> {
    return this.commentsById.get(id) ?? null;
  }

  /** @inheritdoc */
  async findByArticleSlug(articleSlug: string, _currentUserId?: number): Promise<Comment[]> {
    const comments = this.commentsBySlug.get(articleSlug) ?? [];
    return [...comments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** @inheritdoc */
  async create(authorId: number, articleSlug: string, body: string): Promise<Comment> {
    const id = this.nextId++;

    // Look up real author info when a user repository is available (route test mode).
    const user = this.userRepo ? await this.userRepo.findById(authorId) : null;
    const author = user
      ? { username: user.username, bio: user.bio, image: user.image, following: false }
      : { username: 'stub-author', bio: null, image: null, following: false };

    const comment: Comment = {
      id,
      body,
      authorId,
      articleId: 0, // Synthetic — no real article store in-memory
      author,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const existing = this.commentsBySlug.get(articleSlug) ?? [];
    this.commentsBySlug.set(articleSlug, [...existing, comment]);
    this.commentsById.set(id, comment);
    return { ...comment };
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    const comment = this.commentsById.get(id);
    if (!comment) throw new NotFoundError('comment');

    this.commentsById.delete(id);
    for (const [slug, comments] of this.commentsBySlug.entries()) {
      const filtered = comments.filter((c) => c.id !== id);
      if (filtered.length !== comments.length) {
        this.commentsBySlug.set(slug, filtered);
        return;
      }
    }
  }
}
