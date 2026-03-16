
/**
 * Prisma implementation of ICommentRepository.
 * Handles comment CRUD operations.
 */

import { PrismaClient } from '@prisma/client';
import type {
  IComment,
  ICommentWithAuthor,
  ICommentRepository
} from './ICommentRepository';
import { NotFoundError, ForbiddenError } from '../errors/AppError';

export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<IComment | null> {
    return await this.prisma.comment.findUnique({
      where: { id }
    });
  }

  async getByArticleSlug(
    articleSlug: string,
    currentUserId: number | null
  ): Promise<ICommentWithAuthor[]> {
    // First verify article exists
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
      select: { id: true }
    });

    if (!article) {
      throw new NotFoundError('Article', articleSlug);
    }

    // Get comments for article
    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: currentUserId
              ? { where: { followerId: currentUserId }, select: { followerId: true } }
              : false
          }
        }
      }
    });

    return comments.map((comment) => ({
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: currentUserId
          ? Array.isArray(comment.author.followedBy) && comment.author.followedBy.length > 0
          : false
      }
    }));
  }

  async create(
    articleSlug: string,
    body: string,
    authorId: number
  ): Promise<ICommentWithAuthor> {
    // Find article
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
      select: { id: true }
    });

    if (!article) {
      throw new NotFoundError('Article', articleSlug);
    }

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        body,
        authorId,
        articleId: article.id
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true
          }
        }
      }
    });

    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: false // Creator never follows themselves
      }
    };
  }

  async delete(id: number, currentUserId: number): Promise<void> {
    // Find comment
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true }
    });

    if (!comment) {
      throw new NotFoundError('Comment', id);
    }

    // Check authorization
    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this comment');
    }

    // Delete comment
    await this.prisma.comment.delete({
      where: { id }
    });
  }
}
