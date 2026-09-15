import {
  CommentRecord,
  CreateCommentData,
  ICommentRepository,
} from '../../src/repositories/ICommentRepository';

export class InMemoryCommentRepository implements ICommentRepository {
  private readonly comments = new Map<string, CommentRecord>();
  private nextId = 1;

  public async create(data: CreateCommentData): Promise<CommentRecord> {
    const now = new Date();
    const comment = {
      ...data,
      id: String(this.nextId++),
      createdAt: now,
      updatedAt: now,
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  public async findById(id: string): Promise<CommentRecord | null> {
    return this.comments.get(id) ?? null;
  }

  public async listByArticleId(articleId: string): Promise<ReadonlyArray<CommentRecord>> {
    return [...this.comments.values()].filter((comment) => comment.articleId === articleId);
  }

  public async delete(id: string): Promise<void> {
    this.comments.delete(id);
  }
}
