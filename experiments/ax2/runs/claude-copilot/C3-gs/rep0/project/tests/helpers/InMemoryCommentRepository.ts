import { ICommentRepository } from '../../src/repositories/ICommentRepository';
import { CommentEntity, CreateCommentInput } from '../../src/domain/types';

/**
 * In-memory fake implementation of {@link ICommentRepository} for tests.
 */
export class InMemoryCommentRepository implements ICommentRepository {
  private readonly comments: CommentEntity[] = [];
  private nextId = 1;

  /** @inheritdoc */
  async findById(id: number): Promise<CommentEntity | null> {
    const found = this.comments.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  /** @inheritdoc */
  async findByArticle(articleId: number): Promise<CommentEntity[]> {
    return this.comments
      .filter((c) => c.articleId === articleId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((c) => ({ ...c }));
  }

  /** @inheritdoc */
  async create(input: CreateCommentInput): Promise<CommentEntity> {
    const now = new Date();
    const comment: CommentEntity = {
      id: this.nextId++,
      body: input.body,
      articleId: input.articleId,
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now
    };
    this.comments.push(comment);
    return { ...comment };
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    const index = this.comments.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.comments.splice(index, 1);
    }
  }
}
