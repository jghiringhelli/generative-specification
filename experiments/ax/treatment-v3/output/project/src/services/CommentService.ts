import {
  ICommentRepository,
  CommentWithAuthor,
  CreateCommentData
} from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '../errors/AppError';

export interface CreateCommentDTO {
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
 * Comment service - business logic for article comments.
 * Depends on ICommentRepository, IArticleRepository, IProfileRepository interfaces.
 */
export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly articleRepository: IArticleRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * List all comments for an article.
   * @param slug - Article slug
   * @param currentUserId - Optional current user ID for following status
   * @returns Array of comments with author profiles
   * @throws NotFoundError if article not found
   */
  async getComments(slug: string, currentUserId?: number): Promise<CommentResponse[]> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article');
    }

    const comments = await this.commentRepository.findByArticleId(article.id);

    // Enrich with following status for current user
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        let following = false;
        if (currentUserId) {
          following = await this.profileRepository.isFollowing(
            currentUserId,
            comment.authorId
          );
        }

        return {
          id: comment.id,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          body: comment.body,
          author: {
            username: comment.author.username,
            bio: comment.author.bio,
            image: comment.author.image,
            following
          }
        };
      })
    );

    return enrichedComments;
  }

  /**
   * Add a comment to an article.
   * @param slug - Article slug
   * @param dto - Comment creation data
   * @param authorId - Comment author user ID
   * @returns Created comment with author profile
   * @throws NotFoundError if article not found
   */
  async addComment(
    slug: string,
    dto: CreateCommentDTO,
    authorId: number
  ): Promise<CommentResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article');
    }

    if (!dto.body || dto.body.trim().length === 0) {
      throw new ValidationError('Comment body cannot be empty');
    }

    const comment = await this.commentRepository.create({
      body: dto.body,
      authorId,
      articleId: article.id
    });

    // Check if current user follows themselves (always false for self)
    const following = false;

    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following
      }
    };
  }

  /**
   * Delete a comment.
   * @param slug - Article slug
   * @param commentId - Comment ID
   * @param userId - Current user ID (must be comment author)
   * @throws NotFoundError if article or comment not found
   * @throws AuthorizationError if user is not comment author
   */
  async deleteComment(slug: string, commentId: number, userId: number): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article');
    }

    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError('Comment');
    }

    if (comment.articleId !== article.id) {
      throw new NotFoundError('Comment');
    }

    if (comment.authorId !== userId) {
      throw new AuthorizationError('Only the comment author can delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }
}
