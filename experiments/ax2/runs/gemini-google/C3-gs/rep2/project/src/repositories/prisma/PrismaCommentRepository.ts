import { PrismaClient } from '@prisma/client';
import { ICommentRepository, CommentEntity } from '../ICommentRepository';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';

export class PrismaCommentRepository implements ICommentRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapComment(item: any, currentUserId?: string): CommentEntity {
    const following = currentUserId
      ? (item.author.followedBy || []).some((f: any) => f.followerId === currentUserId)
      : false;

    return {
      id: item.id,
      body: item.body,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      author: {
        username: item.author.username,
        bio: item.author.bio,
        image: item.author.image,
        following,
      },
    };
  }

  async findById(id: string): Promise<(CommentEntity & { authorId: string; articleId: string }) | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!comment) return null;
    return {
      ...this.mapComment(comment),
      authorId: comment.authorId,
      articleId: comment.articleId,
    };
  }

  async findByArticleSlug(slug: string, currentUserId?: string): Promise<CommentEntity[]> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: {
                followedBy: currentUserId ? { where: { followerId: currentUserId } } : false,
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundError('Article not found');
    }

    return article.comments.map((c) => this.mapComment(c, currentUserId));
  }

  async create(slug: string, authorId: string, body: string): Promise<CommentEntity> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        body,
        authorId,
        articleId: article.id,
      },
      include: {
        author: true,
      },
    });

    return this.mapComment(comment, authorId);
  }

  async delete(id: string, currentUserId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this comment');
    }

    await this.prisma.comment.delete({
      where: { id },
    });
  }
}
