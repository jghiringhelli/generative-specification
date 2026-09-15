import { z } from 'zod';
import { ProfileData } from '../profiles/profile.dto';

export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'body is required')
  })
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export interface CommentData {
  id: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  body: string;
  author: ProfileData;
}

export interface SingleCommentResponse {
  comment: CommentData;
}

export interface CommentsListResponse {
  comments: CommentData[];
}
