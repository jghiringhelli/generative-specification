import { Comment, CreateCommentInput } from '../domain/types';

/**
 * Persistence port for article comments.
 */
export interface ICommentRepository {
  /**
   * Persist a new comment.
   * @param input - New comment fields.
   * @returns The created comment.
   */
  create(input: CreateCommentInput): Promise<Comment>;

  /**
   * Find a comment by id.
   * @param id - Comment id.
   * @returns The comment, or null if not found.
   */
  findById(id: number): Promise<Comment | null>;

  /**
   * List all comments for an article, newest first.
   * @param articleId - Article id.
   * @returns The article's comments.
   */
  listByArticle(articleId: number): Promise<Comment[]>;

  /**
   * Delete a comment by id.
   * @param id - Comment id.
   */
  delete(id: number): Promise<void>;
}
