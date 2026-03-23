/** Comment domain entity returned from repository operations. */
export interface Comment {
  readonly id: number;
  readonly body: string;
  readonly authorId: number;
  readonly articleId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Comment with author profile data. */
export interface CommentWithAuthor extends Comment {
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

/** Data required to create a new comment. */
export interface CreateCommentData {
  readonly body: string;
  readonly authorId: number;
  readonly articleSlug: string;
}

/**
 * Port interface for comment persistence operations.
 * Services depend on this interface; Prisma implementation is injected at composition root.
 */
export interface ICommentRepository {
  /**
   * Find all comments for an article by its slug.
   * @param articleSlug - The article's URL slug.
   * @param currentUserId - Optional current user ID for following state.
   * @returns Array of comments with author metadata.
   */
  findByArticleSlug(articleSlug: string, currentUserId?: number): Promise<CommentWithAuthor[]>;

  /**
   * Find a single comment by its ID.
   * @param id - The comment's primary key.
   * @returns The comment if found, null otherwise.
   */
  findById(id: number): Promise<Comment | null>;

  /**
   * Create a new comment on an article.
   * @param data - The comment creation data.
   * @returns The created comment with author metadata.
   */
  create(data: CreateCommentData): Promise<CommentWithAuthor>;

  /**
   * Delete a comment by ID.
   * @param id - The comment's primary key.
   */
  delete(id: number): Promise<void>;
}
