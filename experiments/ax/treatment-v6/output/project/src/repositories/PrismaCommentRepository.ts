import type { PrismaClient } from '@prisma/client';
import type {
  ICommentRepository,
  Comment,
  CommentWithAuthor,
  CreateCommentData,
} from './ICommentRepository.js';
import { NotFoundError } from '../errors/AppError.js';

/**
 * Prisma-backed implementation of ICommentRepository.
 * §9 check: implements findByArticleSlug, findById, create, delete.
 */
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findByArticleSlug(articleSlug: string, currentUserId?: number): Promise<CommentWithAuthor[]> {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundError('Article', articleSlug);
    }

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      include: {
        author: {
          include: {
            followedBy: currentUserId ? { where: { followerId: currentUserId } } : false,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((comment) => {
      const authorWithFollows = comment.author as typeof comment.author & {
        followedBy?: { followerId: number }[];
      };
      return {
        id: comment.id,
        body: comment.body,
        authorId: comment.authorId,
        articleId: comment.articleId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          username: comment.author.username,
          bio: comment.author.bio,
          image: comment.author.image,
          following: currentUserId !== undefined
            ? (authorWithFollows.followedBy?.length ?? 0) > 0
            : false,
        },
      };
    });
  }

  /** @inheritdoc */
  async findById(id: number): Promise<Comment | null> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    return comment ?? null;
  }

  /** @inheritdoc */
  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const article = await this.prisma.article.findUnique({
      where: { slug: data.articleSlug },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundError('Article', data.articleSlug);
    }

    const comment = await this.prisma.comment.create({
      data: {
        body: data.body,
        authorId: data.authorId,
        articleId: article.id,
      },
      include: { author: true },
    });

    return {
      id: comment.id,
      body: comment.body,
      authorId: comment.authorId,
      articleId: comment.articleId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: false,
      },
    };
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
