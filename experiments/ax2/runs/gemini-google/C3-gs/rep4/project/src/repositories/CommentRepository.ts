import { ICommentRepository } from './ICommentRepository';
import { CommentEntity } from '../types';
import { prisma } from '../prisma';

export class CommentRepository implements ICommentRepository {
  async findById(id: string): Promise<CommentEntity | null> {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true }
    });
    if (!comment) return null;
    return this.mapToEntity(comment);
  }

  async findByArticleSlug(slug: string): Promise<CommentEntity[]> {
    const comments = await prisma.comment.findMany({
      where: { article: { slug } },
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    });
    return comments.map((c) => this.mapToEntity(c));
  }

  async create(articleId: string, authorId: string, body: string): Promise<CommentEntity> {
    const created = await prisma.comment.create({
      data: {
        body,
        articleId,
        authorId
      },
      include: { author: true }
    });
    return this.mapToEntity(created);
  }

  async delete(id: string): Promise<void> {
    await prisma.comment.delete({
      where: { id }
    });
  }

  private mapToEntity(record: {
    id: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    articleId: string;
    authorId: string;
    author?: any;
  }): CommentEntity {
    return {
      id: record.id,
      body: record.body,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      articleId: record.articleId,
      authorId: record.authorId,
      author: record.author ? {
        id: record.author.id,
        email: record.author.email,
        username: record.author.username,
        passwordHash: record.author.passwordHash,
        bio: record.author.bio ?? '',
        image: record.author.image ?? '',
        createdAt: record.author.createdAt,
        updatedAt: record.author.updatedAt
      } : undefined
    };
  }
}
