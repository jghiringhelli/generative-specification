// src/repositories/CommentRepository.ts
import { PrismaClient } from '@prisma/client';
import { ICommentRepository, CommentEntity } from './ICommentRepository';
import { Comment } from '../types';
import { NotFoundError } from '../errors/AppError';
import { prisma as defaultPrisma } from '../prisma';

export class CommentRepository implements ICommentRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  private async formatComment(
    comment: any,
    currentUserId?: string
  ): Promise<Comment> {
    let following = false;
    if (currentUserId) {
      const follow = await this.prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: comment.author.id
          }
        }
      });
      following = !!follow;
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
        following
      }
    };
  }

  async create(articleSlug: string, authorId: string, body: string): Promise<Comment> {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug }
    });

    if (!article) {
      throw new NotFoundError(`Article '${articleSlug}' not found`);
    }

    const created = await this.prisma.comment.create({
      data: {
        body,
        article: { connect: { id: article.id } },
        author: { connect: { id: authorId } }
      },
      include: {
        author: true
      }
    });

    return this.formatComment(created, authorId);
  }

  async findByArticleSlug(articleSlug: string, currentUserId?: string): Promise<Comment[]> {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug }
    });

    if (!article) {
      throw new NotFoundError(`Article '${articleSlug}' not found`);
    }

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true
      }
    });

    return Promise.all(comments.map(c => this.formatComment(c, currentUserId)));
  }

  async findById(id: number): Promise<CommentEntity | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        articleId: true,
        authorId: true
      }
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id }
    });
  }
}
