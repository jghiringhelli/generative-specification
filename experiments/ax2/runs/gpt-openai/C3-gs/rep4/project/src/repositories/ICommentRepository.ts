import type { Comment, User } from '@prisma/client';

export interface CommentRecord extends Comment {
  readonly author: User;
}

export interface ICommentRepository {
  create(articleId: string, authorId: string, body: string): Promise<CommentRecord>;
  findById(id: string): Promise<CommentRecord | null>;
  listByArticle(articleId: string): Promise<ReadonlyArray<CommentRecord>>;
  delete(id: string): Promise<void>;
}
