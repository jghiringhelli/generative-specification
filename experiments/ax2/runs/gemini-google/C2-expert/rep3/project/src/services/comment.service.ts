import { ForbiddenError, NotFoundError } from '../errors/app-error';
import { ArticleRepository } from '../repositories/article.repository';
import { CommentRepository, CommentWithAuthor } from '../repositories/comment.repository';
import { UserRepository } from '../repositories/user.repository';
import { CommentResponseDto } from '../types/comment.types';
import { CreateCommentInput } from '../validators/comment.validator';

/**
 * Service managing article comments.
 */
export class CommentService {
  private readonly commentRepository: CommentRepository;
  private readonly articleRepository: ArticleRepository;
  private readonly userRepository: UserRepository;

  /**
   * Initializes CommentService.
   */
  constructor(
    commentRepository: CommentRepository = new CommentRepository(),
    articleRepository: ArticleRepository = new ArticleRepository(),
    userRepository: UserRepository = new UserRepository()
  ) {
    this.commentRepository = commentRepository;
    this.articleRepository = articleRepository;
    this.userRepository = userRepository;
  }

  /**
   * Adds a comment to an article.
   */
  async addComment(
    slug: string,
    authorId: number,
    input: CreateCommentInput
  ): Promise<CommentResponseDto> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const created = await this.commentRepository.create(article.id, authorId, input.body);
    return this.toResponseDto(created, authorId);
  }

  /**
   * Retrieves all comments for an article.
   */
  async getComments(slug: string, currentUserId?: number): Promise<CommentResponseDto[]> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const comments = await this.commentRepository.findByArticleId(article.id);
    return Promise.all(comments.map((comment) => this.toResponseDto(comment, currentUserId)));
  }

  /**
   * Deletes a comment from an article.
   */
  async deleteComment(slug: string, commentId: number, currentUserId: number): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const comment = await this.commentRepository.findById(commentId);
    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('Only the comment author can delete this comment');
    }

    await this.commentRepository.delete(comment.id);
  }

  /**
   * Formats a comment record to DTO.
   */
  private async toResponseDto(
    comment: CommentWithAuthor,
    currentUserId?: number
  ): Promise<CommentResponseDto> {
    let following = false;
    if (currentUserId && currentUserId !== comment.authorId) {
      following = await this.userRepository.isFollowing(currentUserId, comment.authorId);
    }

    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following,
      },
    };
  }
}
