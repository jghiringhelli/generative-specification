/**
 * Response presenters: map the domain {@link CommentView} to the RealWorld
 * `comment` / `comments` response envelopes, keeping the domain shape off the
 * wire and rendering dates as ISO-8601 strings.
 *
 * @gs-links: docs/specs/comments.md
 */
import type { CommentView } from '../services/CommentService.js';

/** The embedded author object shared by both envelopes. */
interface AuthorPayload {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/** A comment as rendered on the wire. */
interface CommentPayload {
  readonly id: number;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: AuthorPayload;
}

/** The RealWorld `{ comment: {..} }` response body. */
export interface CommentResponse {
  readonly comment: CommentPayload;
}

/** The RealWorld `{ comments: [..] }` response body. */
export interface CommentListResponse {
  readonly comments: ReadonlyArray<CommentPayload>;
}

/** Shape a single comment for the wire. */
export function toCommentResponse(view: CommentView): CommentResponse {
  return { comment: toPayload(view) };
}

/** Shape a list of comments for the wire. */
export function toCommentListResponse(views: ReadonlyArray<CommentView>): CommentListResponse {
  return { comments: views.map(toPayload) };
}

/** Project a comment view into its wire payload. */
function toPayload(view: CommentView): CommentPayload {
  return {
    id: view.id,
    body: view.body,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
    author: {
      username: view.author.username,
      bio: view.author.bio,
      image: view.author.image,
      following: view.author.following,
    },
  };
}
