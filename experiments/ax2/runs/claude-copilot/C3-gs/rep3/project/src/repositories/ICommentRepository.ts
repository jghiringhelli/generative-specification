import { Comment, CreateCommentInput } from '../types/domain';

/**
 * Persistence contract for article comments.
 */
export interface ICommentRepository {
  /** Persist a new comment and return the created record. */
  create(input: CreateCommentInput): Promise<Comment>;
  /** Find a comment by primary key, or null if none exists. */
  findById(id: number): Promise<Comment | null>;
  /** List all comments for an article, oldest first. */
  findByArticleId(articleId: number): Promise<Comment[]>;
  /** Delete a comment by primary key. */
  delete(id: number): Promise<void>;
}
