export interface CommentAuthor {
  readonly id: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export interface CommentRecord {
  readonly id: number;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly articleId: string;
  readonly authorId: string;
  readonly author: CommentAuthor;
}

export interface CreateCommentData {
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
}

/**
 * Persistence contract for article comments.
 */
export interface ICommentRepository {
  /**
   * Adds a comment to an article.
   *
   * @param {CreateCommentData} data - New comment parameters
   * @returns {Promise<CommentRecord>} Created comment
   */
  create(data: CreateCommentData): Promise<CommentRecord>;

  /**
   * Finds a comment by ID.
   *
   * @param {number} id - Comment ID
   * @returns {Promise<CommentRecord | null>} Comment or null
   */
  findById(id: number): Promise<CommentRecord | null>;

  /**
   * Finds all comments for a given article.
   *
   * @param {string} articleId - Article ID
   * @returns {Promise<readonly CommentRecord[]>} List of comments
   */
  findByArticleId(articleId: string): Promise<readonly CommentRecord[]>;

  /**
   * Deletes a comment by ID.
   *
   * @param {number} id - Comment ID
   * @returns {Promise<void>}
   */
  delete(id: number): Promise<void>;
}
