/**
 * Comment repository port interface.
 * Defines data access contract for Comment entity.
 */
export interface ICommentRepository {
  /**
   * Find comment by ID.
   * @param id - Comment ID
   * @returns Comment with author, or null if not found
   */
  findById(id: number): Promise<CommentWithAuthor | null>;

  /**
   * List all comments for an article.
   * @param articleId - Article ID
   * @returns Array of comments with authors
   */
  findByArticleId(articleId: number): Promise<CommentWithAuthor[]>;

  /**
   * Create a new comment.
   * @param data - Comment creation data
   * @returns Created comment with author
   */
  create(data: CreateCommentData): Promise<CommentWithAuthor>;

  /**
   * Delete a comment.
   * @param id - Comment ID
   */
  delete(id: number): Promise<void>;
}

export interface CommentWithAuthor {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  articleId: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export interface CreateCommentData {
  body: string;
  authorId: number;
  articleId: number;
}
