export interface CommentRecord {
  readonly id: string;
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateCommentData {
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
}

export interface ICommentRepository {
  create(data: CreateCommentData): Promise<CommentRecord>;
  findById(id: string): Promise<CommentRecord | null>;
  listByArticleId(articleId: string): Promise<ReadonlyArray<CommentRecord>>;
  delete(id: string): Promise<void>;
}
