import { CommentWithAuthor, CreateCommentData } from '../domain/entities';

/**
 * Persistence port for article comments.
 */
export interface ICommentRepository {
  /** Persist a new comment and return it joined with its author. */
  create(data: CreateCommentData): Promise<CommentWithAuthor>;

  /** Find a comment by id joined with its author, or null. */
  findById(id: number): Promise<CommentWithAuthor | null>;

  /** List all comments for an article, oldest first, with authors. */
  listByArticle(articleId: string): Promise<CommentWithAuthor[]>;

  /** Delete a comment by id. */
  delete(id: number): Promise<void>;
}
