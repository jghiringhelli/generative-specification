import { CommentWithAuthor } from '../repositories/ICommentRepository';
import { AuthorView } from './articleView';

/**
 * A single comment payload.
 */
export interface CommentView {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: AuthorView;
}

/**
 * Build a comment view.
 * @param comment - The comment with author loaded.
 * @param following - Whether the requesting user follows the comment author.
 * @returns The Conduit comment view.
 */
export function toCommentView(comment: CommentWithAuthor, following: boolean): CommentView {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following,
    },
  };
}
