// src/repositories/CommentRepository.ts
import { PrismaClient } from '@prisma/client';
import { ICommentRepository, CommentRecord, CreateCommentData } from './ICommentRepository';
import { NotFoundError } from '../errors/AppError';

export class CommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async create(data: CreateCommentData): Promise<CommentRecord> {
    const comment = await this.prisma.comment.create({
      data: {
        body: data.body,
        articleId: data.articleId,
        authorId: data.authorId
      },
      include: {
        author: true
      }
    });

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      articleId: comment.articleId,
      authorId: comment.authorId,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    };
  }

  public async findById(id: string): Promise<CommentRecord | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true
      }
    });

    if (!comment) return null;

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      articleId: comment.articleId,
      authorId: comment.authorId,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    };
  }

  public async delete(id: string): Promise<void> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Comment with id '${id}' not found`);
    }
    await this.prisma.comment.delete({ where: { id } });
  }

  public async findByArticleSlug(slug: string): Promise<CommentRecord[]> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: true
          }
        }
      }
    });

    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    return article.comments.map(comment => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      articleId: comment.articleId,
      authorId: comment.authorId,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    }));
  }
}
