import { z } from 'zod';

/**
 * Request DTOs with Zod validation schemas
 */

export const CreateCommentRequestSchema = z.object({
  comment: z.object({
    body: z.string().min(1, "can't be blank"),
  }),
});

export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

/**
 * Response DTOs
 */

export interface CommentAuthor {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface CommentDto {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: CommentAuthor;
}

export interface SingleCommentResponse {
  comment: CommentDto;
}

export interface MultipleCommentsResponse {
  comments: CommentDto[];
}
