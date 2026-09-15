import { CommentEntity, CreateCommentInput } from '../domain/types';

/**
 * Persistence port for article comments.
 */
export interface ICommentRepository {
  /**
   * Find a comment by id.
   * @param id - Comment id.
   * @returns The comment, or null if none exists.
   */
  findById(id: number): Promise<CommentEntity | null>;

  /**
   * List all comments for an article, oldest first.
   * @param articleId - The article id.
   * @returns The comments.
   */
  findByArticle(articleId: number): Promise<CommentEntity[]>;

  /**
   * Create a comment on an article.
   * @param input - Comment fields.
   * @returns The created comment.
   */
  create(input: CreateCommentInput): Promise<CommentEntity>;

  /**
   * Delete a comment by id.
   * @param id - Comment id.
   */
  delete(id: number): Promise<void>;
}
