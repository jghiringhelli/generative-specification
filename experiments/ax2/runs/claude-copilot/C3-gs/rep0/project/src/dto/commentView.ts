import { CommentEntity, UserEntity } from '../domain/types';
import { ArticleAuthorView } from './articleView';

/**
 * A single comment object in the Conduit response format.
 */
export interface CommentView {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: ArticleAuthorView;
}

/**
 * Single-comment response envelope.
 */
export interface CommentResponse {
  comment: CommentView;
}

/**
 * Multi-comment response envelope.
 */
export interface CommentListResponse {
  comments: CommentView[];
}

/**
 * Build a {@link CommentView} from a comment entity, its author, and follow
 * state.
 * @param comment - The comment entity.
 * @param author - The comment author's user entity.
 * @param following - Whether the viewer follows the author.
 * @returns The comment view.
 */
export function toCommentView(
  comment: CommentEntity,
  author: UserEntity,
  following: boolean
): CommentView {
  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: {
      username: author.username,
      bio: author.bio ?? '',
      image: author.image ?? null,
      following
    }
  };
}

/**
 * Wrap a comment view in its response envelope.
 * @param view - The comment view.
 * @returns The single-comment response.
 */
export function toCommentResponse(view: CommentView): CommentResponse {
  return { comment: view };
}

/**
 * Build a multi-comment response.
 * @param views - The comment views.
 * @returns The list response.
 */
export function toCommentListResponse(views: CommentView[]): CommentListResponse {
  return { comments: views };
}
