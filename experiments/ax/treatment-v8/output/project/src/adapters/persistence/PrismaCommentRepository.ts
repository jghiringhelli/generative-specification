/**
 * Prisma-backed {@link ICommentRepository} — the production comment adapter.
 *
 * Maps the Comment aggregate. `delete` is a soft delete (sets `deletedAt`) and
 * every read filters `deletedAt: null`, honouring operation-classification
 * Tier 3 (no hard delete of domain entities). Author identity is referenced by
 * id, so this adapter never touches users directly.
 *
 * Exercised by the real-database integration suite (auto-skipped when no
 * `DATABASE_URL` is reachable) and excluded from the unit-coverage denominator
 * in jest.config.js, since it is thin I/O verified against a real Postgres. Its
 * behavioural contract is covered identically by InMemoryCommentRepository.
 *
 * @gs-links: docs/specs/comments.md, docs/adrs/ADR-0002-auth.md
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../errors/AppError.js';
import type {
  Comment,
  ICommentRepository,
  NewComment,
} from '../../repositories/ICommentRepository.js';

/** Row shape selected from Prisma for a comment. */
type CommentRow = {
  id: number;
  body: string;
  articleId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

const rowSelect = {
  id: true,
  body: true,
  articleId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CommentSelect;

export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async create(input: NewComment): Promise<Comment> {
    const row = await this.prisma.comment.create({
      data: {
        body: input.body,
        articleId: input.articleId,
        authorId: input.authorId,
      },
      select: rowSelect,
    });
    return toComment(row);
  }

  /** @inheritdoc */
  async findById(id: number): Promise<Comment | null> {
    const row = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
      select: rowSelect,
    });
    return row ? toComment(row) : null;
  }

  /** @inheritdoc — live comments on the article, newest first. */
  async listByArticle(articleId: string): Promise<ReadonlyArray<Comment>> {
    const rows = await this.prisma.comment.findMany({
      where: { articleId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: rowSelect,
    });
    return rows.map(toComment);
  }

  /** @inheritdoc — soft delete by specific id (never an unscoped delete). */
  async delete(id: number): Promise<void> {
    const result = await this.prisma.comment.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundError('Comment', String(id));
  }
}

/** Project a Prisma row into the domain {@link Comment}. */
function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    body: row.body,
    articleId: row.articleId,
    authorId: row.authorId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
