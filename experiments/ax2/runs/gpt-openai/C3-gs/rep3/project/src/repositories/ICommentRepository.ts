export interface CommentRecord {
  readonly id: string;
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly author: {
    readonly id: string;
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly followerIds: ReadonlyArray<string>;
  };
}

export interface ICommentRepository {
  findById(id: string): Promise<CommentRecord | null>;
  listByArticle(articleId: string): Promise<ReadonlyArray<CommentRecord>>;
  create(articleId: string, authorId: string, body: string): Promise<CommentRecord>;
  delete(id: string): Promise<void>;
}
