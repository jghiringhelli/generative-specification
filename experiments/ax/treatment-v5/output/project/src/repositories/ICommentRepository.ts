
/**
 * Comment repository interface.
 * Defines the contract for all comment data access operations.
 */

export interface IComment {
  id: number;
  body: string;
  authorId: number;
  articleId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentWithAuthor {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface ICommentRepository {
  /**
   * Find comment by ID.
   * @returns Comment if found, null otherwise
   */
  findById(id: number): Promise<IComment | null>;

  /**
   * Get all comments for an article.
   * @param articleSlug - Article slug
   * @param currentUserId - ID of user viewing comments (null if anonymous)
   * @returns List of comments with author metadata
   * @throws NotFoundError if article does not exist
   */
  getByArticleSlug(
    articleSlug: string,
    currentUserId: number | null
  ): Promise<ICommentWithAuthor[]>;

  /**
   * Add a comment to an article.
   * @param articleSlug - Article slug
   * @param body - Comment text
   * @param authorId - ID of user posting the comment
   * @returns Created comment with author metadata
   * @throws NotFoundError if article does not exist
   */
  create(
    articleSlug: string,
    body: string,
    authorId: number
  ): Promise<ICommentWithAuthor>;

  /**
   * Delete a comment by ID.
   * @param id - Comment ID
   * @param currentUserId - ID of user attempting deletion
   * @throws NotFoundError if comment does not exist
   * @throws ForbiddenError if current user is not the comment author
   */
  delete(id: number, currentUserId: number): Promise<void>;
}
