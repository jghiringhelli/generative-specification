import { PrismaClient, Comment, Prisma } from '@prisma/client';
import { ICommentRepository, CreateCommentData } from './ICommentRepository';

type CommentWithAuthor = Comment & {
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
    followedBy: { followerId: number }[];
  };
};

export class CommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number, currentUserId?: number): Promise<CommentWithAuthor | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: this.getCommentIncludes(currentUserId),
    }) as Promise<CommentWithAuthor | null>;
  }

  async findByArticleSlug(slug: string, currentUserId?: number): Promise<CommentWithAuthor[]> {
    return this.prisma.comment.findMany({
      where: {
        article: {
          slug,
        },
      },
      include: this.getCommentIncludes(currentUserId),
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<CommentWithAuthor[]>;
  }

  async create(data: CreateCommentData, currentUserId?: number): Promise<CommentWithAuthor> {
    // First check if article exists
    const article = await this.prisma.article.findUnique({
      where: { slug: data.articleSlug },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        body: data.body,
        authorId: data.authorId,
        articleId: article.id,
      },
      include: this.getCommentIncludes(currentUserId),
    });

    return comment as CommentWithAuthor;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id },
    });
  }

  /**
   * Build Prisma include clause for comment queries with author
   */
  private getCommentIncludes(currentUserId?: number): Prisma.CommentInclude {
    return {
      author: {
        select: {
          id: true,
          username: true,
          bio: true,
          image: true,
          followedBy: currentUserId
            ? {
                where: {
                  followerId: currentUserId,
                },
                select: {
                  followerId: true,
                },
              }
            : false,
        },
      },
    };
  }
}
