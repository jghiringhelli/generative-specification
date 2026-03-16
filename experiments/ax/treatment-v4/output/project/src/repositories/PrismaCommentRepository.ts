import { PrismaClient } from '@prisma/client';
import {
  ICommentRepository,
  CommentEntity,
  CreateCommentData
} from './ICommentRepository';

/**
 * Prisma implementation of comment repository.
 */
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCommentData): Promise<CommentEntity> {
    // First, find the article by slug to get its ID
    const article = await this.prisma.article.findUnique({
      where: { slug: data.articleSlug }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        body: data.body,
        authorId: data.authorId,
        articleId: article.id
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: {
              where: { followerId: data.authorId },
              select: { followerId: true }
            }
          }
        }
      }
    });

    return this.mapToCommentEntity(comment, data.authorId);
  }

  async listByArticle(slug: string, currentUserId?: number): Promise<CommentEntity[]> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!article) {
      return [];
    }

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return comments.map(c => this.mapToCommentEntity(c, currentUserId));
  }

  async findById(id: number): Promise<CommentEntity | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            bio: true,
            image: true
          }
        }
      }
    });

    if (!comment) {
      return null;
    }

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: false
      },
      authorId: comment.author.id
    };
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id }
    });
  }

  /**
   * Map Prisma result to CommentEntity.
   */
  private mapToCommentEntity(comment: any, currentUserId?: number): CommentEntity {
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: currentUserId
          ? (comment.author.followedBy as any[]).length > 0
          : false
      },
      authorId: comment.authorId
    };
  }
}
