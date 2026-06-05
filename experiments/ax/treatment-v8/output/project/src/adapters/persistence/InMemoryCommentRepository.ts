/**
 * In-memory {@link ICommentRepository}.
 *
 * A genuine working implementation (a Fake, not a mock) of the comment
 * persistence port: it holds comments and soft-delete state, enforcing the same
 * observable contract the database does — newest-first ordering per article and
 * exclusion of soft-deleted rows from every read. Used as the driven adapter in
 * subcutaneous tests and for local development without a database. Production
 * wiring uses {@link PrismaCommentRepository}.
 *
 * @gs-links: docs/specs/comments.md
 */
import { NotFoundError } from '../../errors/AppError.js';
import type {
  Comment,
  ICommentRepository,
  NewComment,
} from '../../repositories/ICommentRepository.js';

/** Stored comment record: the domain fields plus internal bookkeeping. */
interface StoredComment {
  readonly id: number;
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  /** Monotonic insertion sequence — tie-breaks recency ordering deterministically. */
  readonly seq: number;
  deletedAt: Date | null;
}

export class InMemoryCommentRepository implements ICommentRepository {
  private readonly commentsById = new Map<number, StoredComment>();
  private seq = 0;
  /** Monotonic id generator mirroring the database's autoincrement (ids start at 1). */
  private nextId = 1;

  /** @inheritdoc */
  create(input: NewComment): Promise<Comment> {
    const now = new Date();
    const stored: StoredComment = {
      id: this.nextId++,
      body: input.body,
      articleId: input.articleId,
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now,
      seq: this.seq++,
      deletedAt: null,
    };
    this.commentsById.set(stored.id, stored);
    return Promise.resolve(toComment(stored));
  }

  /** @inheritdoc */
  findById(id: number): Promise<Comment | null> {
    const stored = this.commentsById.get(id);
    const live = stored && stored.deletedAt === null ? stored : undefined;
    return Promise.resolve(live ? toComment(live) : null);
  }

  /** @inheritdoc — live comments on the article, newest first. */
  listByArticle(articleId: string): Promise<ReadonlyArray<Comment>> {
    const matched = [...this.commentsById.values()]
      .filter((comment) => comment.deletedAt === null && comment.articleId === articleId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.seq - a.seq)
      .map(toComment);
    return Promise.resolve(matched);
  }

  /** @inheritdoc — soft delete: the row is retained but excluded from all reads. */
  delete(id: number): Promise<void> {
    const stored = this.commentsById.get(id);
    if (!stored || stored.deletedAt !== null) {
      return Promise.reject(new NotFoundError('Comment', String(id)));
    }
    stored.deletedAt = new Date();
    return Promise.resolve();
  }
}

/** Project a stored record into the domain {@link Comment}. */
function toComment(stored: StoredComment): Comment {
  return {
    id: stored.id,
    body: stored.body,
    articleId: stored.articleId,
    authorId: stored.authorId,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}
