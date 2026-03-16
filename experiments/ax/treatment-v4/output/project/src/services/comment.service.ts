import { ICommentRepository } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { NotFoundError, AuthorizationError } from '../errors/AppError';

export interface CreateCommentDto {
  body: string;
}

export interface CommentResponse {
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

/**
 * Comment service.
 * Handles comment creation, retrieval, and deletion.
 */
export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly articleRepository: IArticleRepository
  ) {}

  /**
   * Get all comments for an article.
   * @param slug - Article slug
   * @param currentUserId - Optional current user ID for following status
   * @returns Array of comments
   * @throws NotFoundError if article not found
   */
  async getComments(slug: string, currentUserId?: number): Promise<CommentResponse[]> {
    // Verify article exists
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    const comments = await this.commentRepository.listByArticle(slug, currentUserId);
    
    return comments.map(c => ({
      id: c.id,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      body: c.body,
      author: c.author
    }));
  }

  /**
   * Add a comment to an article.
   * @param slug - Article slug
   * @param dto - Comment data
   * @param authorId - Author user ID
   * @returns Created comment
   * @throws NotFoundError if article not found
   */
  async addComment(
    slug: string,
    dto: CreateCommentDto,
    authorId: number
  ): Promise<CommentResponse> {
    // Verify article exists
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    const comment = await this.commentRepository.create({
      body: dto.body,
      authorId,
      articleSlug: slug
    });

    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: comment.author
    };
  }

  /**
   * Delete a comment.
   * @param commentId - Comment ID
   * @param currentUserId - Current user ID
   * @throws NotFoundError if comment not found
   * @throws AuthorizationError if user is not the comment author
   */
  async deleteComment(commentId: number, currentUserId: number): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError('Comment', commentId);
    }

    // Authorization check: only author can delete
    if (comment.authorId !== currentUserId) {
      throw new AuthorizationError('Only the comment author can delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }
}
