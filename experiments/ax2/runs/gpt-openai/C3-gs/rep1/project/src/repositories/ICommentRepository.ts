export interface CommentAuthorRecord {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export interface CommentRecord {
  readonly id: string;
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
  readonly author: CommentAuthorRecord;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateCommentRecord {
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
}

export interface ICommentRepository {
  findById(id: string, viewerId?: string): Promise<CommentRecord | null>;
  listByArticleId(articleId: string, viewerId?: string): Promise<ReadonlyArray<CommentRecord>>;
  create(data: CreateCommentRecord): Promise<CommentRecord>;
  delete(id: string): Promise<void>;
}
