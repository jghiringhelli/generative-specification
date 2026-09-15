import { CommentRepository, CommentWithAuthor } from './comment.repository';
import { ProfileRepository } from '../profiles/profile.repository';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

/** Serialized comment shape returned by the API. */
export interface CommentDto {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/** Response envelope for a list of comments. */
export interface CommentListResponse {
  comments: CommentDto[];
}

/** Response envelope for a single comment. */
export interface SingleCommentResponse {
  comment: CommentDto;
}

/**
 * Business logic for article comments.
 */
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  /**
   * Lists comments for an article.
   * @param slug the parent article slug
   * @param currentUserId the viewer id, if any
   * @returns the comment list response
   * @throws NotFoundError when the article does not exist
   */
  async listComments(
    slug: string,
    currentUserId?: number,
  ): Promise<CommentListResponse> {
    const articleId = await this.requireArticleId(slug);
    const comments = await this.commentRepository.listByArticle(articleId);
    const dtos = await Promise.all(
      comments.map((comment) => this.serialize(comment, currentUserId)),
    );
    return { comments: dtos };
  }

  /**
   * Adds a comment to an article.
   * @param slug the parent article slug
   * @param body the comment body
   * @param currentUserId the authenticated author id
   * @returns the created single comment response
   * @throws NotFoundError when the article does not exist
   */
  async addComment(
    slug: string,
    body: string,
    currentUserId: number,
  ): Promise<SingleCommentResponse> {
    const articleId = await this.requireArticleId(slug);
    const comment = await this.commentRepository.create(
      articleId,
      currentUserId,
      body,
    );
    return { comment: await this.serialize(comment, currentUserId) };
  }

  /**
   * Deletes a comment the current user authored.
   * @param slug the parent article slug
   * @param commentId the comment id
   * @param currentUserId the authenticated user id
   * @throws NotFoundError when the article or comment does not exist
   * @throws ForbiddenError when the user is not the comment author
   */
  async deleteComment(
    slug: string,
    commentId: number,
    currentUserId: number,
  ): Promise<void> {
    await this.requireArticleId(slug);
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('comment not found');
    }
    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('you are not the author of this comment');
    }
    await this.commentRepository.delete(commentId);
  }

  /**
   * Resolves an article id by slug or throws.
   * @param slug the article slug
   * @returns the article id
   * @throws NotFoundError when the article does not exist
   */
  private async requireArticleId(slug: string): Promise<number> {
    const articleId = await this.commentRepository.findArticleIdBySlug(slug);
    if (articleId === null) {
      throw new NotFoundError('article not found');
    }
    return articleId;
  }

  /**
   * Maps a comment entity to the API DTO, resolving following state.
   * @param comment the comment with author
   * @param currentUserId the viewer id, if any
   * @returns the serialized comment DTO
   */
  private async serialize(
    comment: CommentWithAuthor,
    currentUserId?: number,
  ): Promise<CommentDto> {
    const following = currentUserId
      ? await this.profileRepository.isFollowing(
          currentUserId,
          comment.authorId,
        )
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
}
