import { z } from 'zod';
import { ICommentRepository, CommentRecord } from '../repositories/comment-repository.interface';
import { CommentRepository } from '../repositories/comment-repository';
import { IArticleRepository } from '../repositories/article-repository.interface';
import { ArticleRepository } from '../repositories/article-repository';
import { IProfileRepository } from '../repositories/profile-repository.interface';
import { ProfileRepository } from '../repositories/profile-repository';
import { NotFoundError, ForbiddenError } from '../errors/http-error';

export const AddCommentInputSchema = z.object({
  comment: z.object({
    body: z.string().trim().min(1, 'Comment body cannot be empty'),
  }),
});

export type AddCommentInput = z.infer<typeof AddCommentInputSchema>;

export interface CommentAuthorDto {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export interface CommentDto {
  readonly id: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly body: string;
  readonly author: CommentAuthorDto;
}

/**
 * Service orchestrating article comments.
 */
export class CommentService {
  private readonly commentRepo: ICommentRepository;
  private readonly articleRepo: IArticleRepository;
  private readonly profileRepo: IProfileRepository;

  /**
   * Constructs the CommentService.
   *
   * @param {ICommentRepository} [commentRepo=new CommentRepository()] - Injected comment repo
   * @param {IArticleRepository} [articleRepo=new ArticleRepository()] - Injected article repo
   * @param {IProfileRepository} [profileRepo=new ProfileRepository()] - Injected profile repo
   */
  constructor(
    commentRepo: ICommentRepository = new CommentRepository(),
    articleRepo: IArticleRepository = new ArticleRepository(),
    profileRepo: IProfileRepository = new ProfileRepository()
  ) {
    this.commentRepo = commentRepo;
    this.articleRepo = articleRepo;
    this.profileRepo = profileRepo;
  }

  private async mapCommentToDto(comment: CommentRecord, currentUserId?: string): Promise<CommentDto> {
    const following = currentUserId
      ? await this.profileRepo.isFollowing(currentUserId, comment.authorId)
      : false;

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

  /**
   * Retrieves all comments for an article by its slug.
   *
   * @param {string} slug - Article slug
   * @param {string} [currentUserId] - Optional viewer user ID
   * @returns {Promise<readonly CommentDto[]>} List of comments
   */
  public async getComments(slug: string, currentUserId?: string): Promise<readonly CommentDto[]> {
    const article = await this.articleRepo.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const comments = await this.commentRepo.findByArticleId(article.id);
    return Promise.all(comments.map((c) => this.mapCommentToDto(c, currentUserId)));
  }

  /**
   * Adds a new comment to an article.
   *
   * @param {string} slug - Article slug
   * @param {AddCommentInput} input - Comment content
   * @param {string} authorId - Authenticated author ID
   * @returns {Promise<CommentDto>} Created comment DTO
   */
  public async addComment(
    slug: string,
    input: AddCommentInput,
    authorId: string
  ): Promise<CommentDto> {
    const article = await this.articleRepo.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const comment = await this.commentRepo.create({
      body: input.comment.body,
      articleId: article.id,
      authorId,
    });

    return this.mapCommentToDto(comment, authorId);
  }

  /**
   * Deletes a comment by ID if authored by the user.
   *
   * @param {string} slug - Article slug
   * @param {number} commentId - Comment ID
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<void>}
   */
  public async deleteComment(slug: string, commentId: number, userId: string): Promise<void> {
    const article = await this.articleRepo.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const comment = await this.commentRepo.findById(commentId);
    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenError('You are not authorized to delete this comment');
    }

    await this.commentRepo.delete(commentId);
  }
}
