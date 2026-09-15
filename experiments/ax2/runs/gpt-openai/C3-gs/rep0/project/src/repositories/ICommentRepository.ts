export interface CommentRecord {
  readonly id: string;
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ICommentRepository {
  listByArticle(articleId: string): Promise<readonly CommentRecord[]>;
  findById(id: string): Promise<CommentRecord | null>;
  create(articleId: string, authorId: string, body: string): Promise<CommentRecord>;
  delete(id: string): Promise<void>;
}
