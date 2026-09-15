import { ApplicationError } from '../errors/application-error';
import { CommentRepository, type CommentRecord } from './repository';

interface CommentDto {
  readonly id: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly body: string;
  readonly author: { username: string; bio: string | null; image: string | null; following: boolean };
}

export class CommentService {
  public constructor(private readonly comments: CommentRepository) {}

  /** Lists comments for an existing article. */
  public async list(slug: string, viewerId?: number): Promise<{ comments: CommentDto[] }> {
    await this.requireArticle(slug);
    return { comments: (await this.comments.list(slug)).map((record) => this.toDto(record, viewerId)) };
  }

  /** Adds a comment to an existing article. */
  public async add(slug: string, authorId: number, body: string): Promise<{ comment: CommentDto }> {
    await this.requireArticle(slug);
    return { comment: this.toDto(await this.comments.create(slug, authorId, body), authorId) };
  }

  /** Deletes a comment owned by the authenticated user. */
  public async delete(slug: string, id: number, userId: number): Promise<void> {
    await this.requireArticle(slug);
    const comment = await this.comments.findByArticle(id, slug);
    if (!comment) throw new ApplicationError('Comment not found', 404);
    if (comment.authorId !== userId) throw new ApplicationError('Only the author may delete this comment', 403);
    await this.comments.delete(id);
  }

  private async requireArticle(slug: string): Promise<void> {
    if (!(await this.comments.articleExists(slug))) throw new ApplicationError('Article not found', 404);
  }

  private toDto(record: CommentRecord, viewerId?: number): CommentDto {
    return {
      id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt, body: record.body,
      author: {
        username: record.author.username, bio: record.author.bio, image: record.author.image,
        following: record.author.followers.some(({ followerId }) => followerId === viewerId),
      },
    };
  }
}
