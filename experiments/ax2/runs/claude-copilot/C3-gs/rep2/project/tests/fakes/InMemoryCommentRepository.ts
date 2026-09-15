import { ICommentRepository } from '../../src/repositories/ICommentRepository';
import { Comment, CreateCommentInput } from '../../src/domain/types';

/**
 * In-memory fake implementing {@link ICommentRepository}.
 */
export class InMemoryCommentRepository implements ICommentRepository {
  private readonly comments = new Map<number, Comment>();
  private nextId = 1;

  /** @inheritdoc */
  async create(input: CreateCommentInput): Promise<Comment> {
    const now = new Date();
    const comment: Comment = {
      id: this.nextId++,
      body: input.body,
      articleId: input.articleId,
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now,
    };
    this.comments.set(comment.id, comment);
    return { ...comment };
  }

  /** @inheritdoc */
  async findById(id: number): Promise<Comment | null> {
    const comment = this.comments.get(id);
    return comment ? { ...comment } : null;
  }

  /** @inheritdoc */
  async listByArticle(articleId: number): Promise<Comment[]> {
    return [...this.comments.values()]
      .filter((c) => c.articleId === articleId)
      .sort((a, b) => b.id - a.id)
      .map((c) => ({ ...c }));
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    this.comments.delete(id);
  }
}
