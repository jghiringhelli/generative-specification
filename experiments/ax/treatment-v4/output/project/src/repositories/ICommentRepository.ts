
/**
 * Comment repository port interface.
 */
export interface ICommentRepository {
  /**
   * Create a new comment on an article.
   * @param data - Comment creation data
   * @returns Created comment with author profile
   */
  create(data: CreateCommentData): Promise<CommentEntity>;

  /**
   * List all comments for an article.
   * @param slug - Article slug
   * @param currentUserId - Optional user ID for following status
   * @returns Comments with author profiles
   */
  listByArticle(slug: string, currentUserId?: number): Promise<CommentEntity[]>;

  /**
   * Find comment by ID.
   * @param id - Comment ID
   * @returns Comment or null if not found
   */
  findById(id: number): Promise<CommentEntity | null>;

  /**
   * Delete a comment by ID.
   * @param id - Comment ID
   */
  delete(id: number): Promise<void>;
}

export interface CommentEntity {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
  authorId?: number; // For internal authorization checks
}

export interface CreateCommentData {
  body: string;
  authorId: number;
  articleSlug: string;
}
