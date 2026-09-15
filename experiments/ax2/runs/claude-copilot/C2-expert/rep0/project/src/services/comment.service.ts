import { z } from 'zod';
import {
  CommentRepository,
  type CommentWithAuthor
} from '../repositories/comment.repository';
import { ArticleRepository } from '../repositories/article.repository';
import { FollowRepository } from '../repositories/follow.repository';
import { parseOrThrow } from '../utils/validation';
import { ForbiddenError, NotFoundError } from '../errors';

const createSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'body is required')
  })
});

/** Author sub-view embedded in comment responses. */
export interface CommentAuthorView {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/** Public representation of a comment. */
export interface CommentView {
  readonly id: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly body: string;
  readonly author: CommentAuthorView;
}

/**
 * Application service implementing article comment use cases.
 */
export class CommentService {
  private readonly commentRepository: CommentRepository;
  private readonly articleRepository: ArticleRepository;
  private readonly followRepository: FollowRepository;

  constructor(
    commentRepository: CommentRepository,
    articleRepository: ArticleRepository,
    followRepository: FollowRepository
  ) {
    this.commentRepository = commentRepository;
    this.articleRepository = articleRepository;
    this.followRepository = followRepository;
  }

  /**
   * Lists comments for an article.
   * @param slug The article slug.
   * @param currentUserId The viewing user's id, if authenticated.
   * @returns The comment views.
   * @throws {NotFoundError} When the article does not exist.
   */
  async listComments(
    slug: string,
    currentUserId?: number
  ): Promise<CommentView[]> {
    const article = await this.requireArticleId(slug);
    const comments = await this.commentRepository.findByArticle(article);
    return Promise.all(
      comments.map((comment) => this.toView(comment, currentUserId))
    );
  }

  /**
   * Adds a comment to an article.
   * @param slug The article slug.
   * @param payload The raw request body.
   * @param currentUserId The authenticated author's id.
   * @returns The created comment view.
   * @throws {NotFoundError} When the article does not exist.
   */
  async addComment(
    slug: string,
    payload: unknown,
    currentUserId: number
  ): Promise<CommentView> {
    const articleId = await this.requireArticleId(slug);
    const { comment } = parseOrThrow(createSchema, payload);
    const created = await this.commentRepository.create(
      articleId,
      currentUserId,
      comment.body
    );
    return this.toView(created, currentUserId);
  }

  /**
   * Deletes a comment owned by the current user.
   * @param slug The article slug.
   * @param commentId The comment id.
   * @param currentUserId The authenticated user's id.
   * @throws {NotFoundError} When the article or comment does not exist.
   * @throws {ForbiddenError} When the user is not the comment author.
   */
  async deleteComment(
    slug: string,
    commentId: number,
    currentUserId: number
  ): Promise<void> {
    await this.requireArticleId(slug);
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('comment does not exist');
    }
    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('you are not the author of this comment');
    }
    await this.commentRepository.delete(commentId);
  }

  private async requireArticleId(slug: string): Promise<number> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article does not exist');
    }
    return article.id;
  }

  private async toView(
    comment: CommentWithAuthor,
    currentUserId?: number
  ): Promise<CommentView> {
    const following =
      currentUserId !== undefined
        ? await this.followRepository.isFollowing(
            currentUserId,
            comment.authorId
          )
        : false;
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
}
