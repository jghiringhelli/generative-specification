import { Comment, User } from "@prisma/client";

import { toProfileResponse } from "../profiles/profile.dto";

export type CommentSource = Comment & {
  author: User & { followers: Array<{ id: number }> };
};

export function toCommentResponse(comment: CommentSource, currentUserId?: number) {
  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: toProfileResponse(comment.author, currentUserId),
  };
}
