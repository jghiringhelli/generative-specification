import { Comment, User } from '@prisma/client';

/**
 * Data required to create a comment.
 */
export interface CreateCommentData {
  body: string;
  articleId: number;
  authorId: number;
}

/**
 * A comment with its author eagerly loaded.
 */
export type CommentWithAuthor = Comment & {
  author: User;
};

/**
 * Persistence port for comment operations.
 */
export interface ICommentRepository {
  /**
   * Create a comment on an article.
   * @param data - Comment body, article id, and author id.
   * @returns The persisted comment with author.
   */
  create(data: CreateCommentData): Promise<CommentWithAuthor>;

  /**
   * List comments for an article, most recent first.
   * @param articleId - Article id.
   * @returns Comments with authors.
   */
  findByArticleId(articleId: number): Promise<CommentWithAuthor[]>;

  /**
   * Find a comment by id.
   * @param id - Comment id.
   * @returns The comment with author or null.
   */
  findById(id: number): Promise<CommentWithAuthor | null>;

  /**
   * Delete a comment by id.
   * @param id - Comment id.
   */
  delete(id: number): Promise<void>;
}
