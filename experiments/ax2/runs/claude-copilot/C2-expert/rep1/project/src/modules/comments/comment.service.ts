import { CommentRepository, CommentWithAuthor } from './comment.repository';
import { ProfileRepository } from '../profiles/profile.repository';
import { NotFoundError, ForbiddenError } from '../../lib/errors';

/** Comment author sub-document. */
export interface CommentAuthorView {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/** Single comment view (RealWorld shape). */
export interface CommentView {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: CommentAuthorView;
}

/** Envelope for a list of comments. */
export interface CommentListResponse {
  comments: CommentView[];
}

/** Envelope for a single comment. */
export interface CommentResponse {
  comment: CommentView;
}

/**
 * Business logic for article comments.
 */
export class CommentService {
  /**
   * @param commentRepository injected comment persistence port
   * @param profileRepository injected profile/following persistence port
   */
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly profileRepository: ProfileRepository
  ) {}

  /**
   * Resolves an article id by slug or throws.
   * @param slug the article slug
   * @returns the article id
   * @throws NotFoundError when the article does not exist
   */
  private async requireArticleId(slug: string): Promise<number> {
    const articleId = await this.commentRepository.findArticleIdBySlug(slug);
    if (articleId === null) {
      throw new NotFoundError('Article not found');
    }
    return articleId;
  }

  /**
   * Maps a comment entity to its response view.
   * @param comment the comment with author
   * @param viewerId the authenticated viewer id, if any
   * @returns the comment view DTO
   */
  private async toView(
    comment: CommentWithAuthor,
    viewerId?: number
  ): Promise<CommentView> {
    const following = viewerId
      ? await this.profileRepository.isFollowing(viewerId, comment.authorId)
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
        following
      }
    };
  }

  /**
   * Lists comments for an article.
   * @param slug the article slug
   * @param viewerId the authenticated viewer id, if any
   * @returns the comment list response
   * @throws NotFoundError when the article does not exist
   */
  async list(slug: string, viewerId?: number): Promise<CommentListResponse> {
    const articleId = await this.requireArticleId(slug);
    const comments = await this.commentRepository.listByArticle(articleId);
    return {
      comments: await Promise.all(comments.map((comment) => this.toView(comment, viewerId)))
    };
  }

  /**
   * Adds a comment to an article.
   * @param slug the article slug
   * @param body the comment body
   * @param authorId the authenticated author id
   * @returns the created comment response
   * @throws NotFoundError when the article does not exist
   */
  async add(slug: string, body: string, authorId: number): Promise<CommentResponse> {
    const articleId = await this.requireArticleId(slug);
    const comment = await this.commentRepository.create(body, authorId, articleId);
    return { comment: await this.toView(comment, authorId) };
  }

  /**
   * Deletes a comment; only its author may do so.
   * @param slug the article slug
   * @param commentId the comment id
   * @param viewerId the authenticated viewer id
   * @throws NotFoundError when article/comment missing; ForbiddenError otherwise
   */
  async delete(slug: string, commentId: number, viewerId: number): Promise<void> {
    await this.requireArticleId(slug);
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    if (comment.authorId !== viewerId) {
      throw new ForbiddenError('You are not the author of this comment');
    }
    await this.commentRepository.delete(commentId);
  }
}
