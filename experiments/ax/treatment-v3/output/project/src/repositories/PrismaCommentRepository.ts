import { PrismaClient } from '@prisma/client';
import {
  ICommentRepository,
  CommentWithAuthor,
  CreateCommentData
} from './ICommentRepository';

/**
 * Prisma implementation of ICommentRepository.
 * Single responsibility: translate Comment domain operations to Prisma ORM calls.
 */
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<CommentWithAuthor | null> {
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
      authorId: comment.authorId,
      articleId: comment.articleId,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    };
  }

  async findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            bio: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.authorId,
      articleId: comment.articleId,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    }));
  }

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const comment = await this.prisma.comment.create({
      data: {
        body: data.body,
        authorId: data.authorId,
        articleId: data.articleId
      },
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

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.authorId,
      articleId: comment.articleId,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    };
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id }
    });
  }
}
