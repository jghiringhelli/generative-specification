import { PrismaClient, Prisma } from '@prisma/client';
import type { Comment } from '../types/domain';
import type { ICommentRepository } from './ICommentRepository';
import { NotFoundError } from '../errors/AppError';

/** Prisma error code for record-not-found on update/delete. */
const PRISMA_NOT_FOUND = 'P2025';

/**
 * Sentinel viewer ID used when no authenticated user is present.
 * Matches the convention in PrismaArticleRepository — never equals a real user ID.
 */
const NO_VIEWER = -1;

/**
 * Shape of the Prisma comment payload returned by all read queries.
 * Manually typed to avoid complex Prisma generic inference throughout the class.
 */
interface CommentRow {
  id: number;
  body: string;
  authorId: number;
  articleId: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
    followers: { followerId: number }[];
  };
}

/**
 * Build the Prisma include object for comment queries.
 * Author's `following` field is viewer-relative, filtered by sentinel value NO_VIEWER
 * when no authenticated user is present.
 *
 * @param viewerId - Authenticated user ID, or NO_VIEWER (-1) for anonymous
 */
function buildCommentInclude(viewerId: number) {
  return {
    author: {
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
        followers: {
          where: { followerId: viewerId },
          select: { followerId: true },
        },
      },
    },
  };
}

/**
 * Map a raw Prisma comment row to the domain `Comment` entity.
 */
function mapToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    body: row.body,
    authorId: row.authorId,
    articleId: row.articleId,
    author: {
      username: row.author.username,
      bio: row.author.bio,
      image: row.author.image,
      following: row.author.followers.length > 0,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * PostgreSQL-backed implementation of `ICommentRepository` via Prisma.
 *
 * All database I/O for comment operations is confined to this adapter.
 * Domain services import `ICommentRepository` only — never this class directly.
 * Wire at the composition root (`src/server.ts`).
 */
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findById(id: number): Promise<Comment | null> {
    const row = await this.prisma.comment.findUnique({
      where: { id },
      include: buildCommentInclude(NO_VIEWER),
    });
    return row ? mapToComment(row as unknown as CommentRow) : null;
  }

  /** @inheritdoc */
  async findByArticleSlug(articleSlug: string, currentUserId?: number): Promise<Comment[]> {
    const viewerId = currentUserId ?? NO_VIEWER;
    const rows = await this.prisma.comment.findMany({
      where: { article: { slug: articleSlug } },
      orderBy: { createdAt: 'desc' },
      include: buildCommentInclude(viewerId),
    });
    return rows.map((r) => mapToComment(r as unknown as CommentRow));
  }

  /** @inheritdoc */
  async create(authorId: number, articleSlug: string, body: string): Promise<Comment> {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
      select: { id: true },
    });
    if (!article) throw new NotFoundError('article');

    const row = await this.prisma.comment.create({
      data: { body, authorId, articleId: article.id },
      include: buildCommentInclude(authorId),
    });
    return mapToComment(row as unknown as CommentRow);
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    try {
      await this.prisma.comment.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_NOT_FOUND) {
        throw new NotFoundError('comment');
      }
      throw err;
    }
  }
}
