import { z } from 'zod';
import { AuthorProfile } from '../repositories/IArticleRepository';

export const CreateCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'Comment body is required'),
  }),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>['comment'];

export interface CommentResponseData {
  id: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: AuthorProfile;
}

export interface SingleCommentResponseDTO {
  comment: CommentResponseData;
}

export interface MultipleCommentsResponseDTO {
  comments: CommentResponseData[];
}
