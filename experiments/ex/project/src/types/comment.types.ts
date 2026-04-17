import { ProfileResponse } from './profile.types';

/**
 * Comment response DTO.
 */
export interface CommentResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: ProfileResponse;
}

/**
 * Multiple comments response DTO.
 */
export interface MultipleCommentsResponse {
  comments: CommentResponse[];
}

/**
 * Create comment DTO.
 */
export interface CreateCommentDTO {
  body: string;
}
