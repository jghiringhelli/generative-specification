import {
  CommentRecord,
  ICommentRepository,
} from '../../src/repositories/ICommentRepository';

export class InMemoryCommentRepository implements ICommentRepository {
  private readonly comments: CommentRecord[] = [];
  private nextId = 1;

  public findById(id: string): Promise<CommentRecord | null> {
    return Promise.resolve(this.comments.find((item) => item.id === id) ?? null);
  }

  public listByArticle(
    articleId: string,
  ): Promise<ReadonlyArray<CommentRecord>> {
    return Promise.resolve(
      this.comments.filter((comment) => comment.articleId === articleId),
    );
  }

  public create(
    articleId: string,
    authorId: string,
    body: string,
  ): Promise<CommentRecord> {
    const now = new Date();
    const comment: CommentRecord = {
      id: String(this.nextId++),
      articleId,
      authorId,
      body,
      createdAt: now,
      updatedAt: now,
      author: {
        id: authorId,
        username: authorId === '1' ? 'alice' : 'bob',
        bio: null,
        image: null,
        followerIds: [],
      },
    };
    this.comments.push(comment);
    return Promise.resolve(comment);
  }

  public delete(id: string): Promise<void> {
    const index = this.comments.findIndex((comment) => comment.id === id);
    if (index >= 0) this.comments.splice(index, 1);
    return Promise.resolve();
  }
}
