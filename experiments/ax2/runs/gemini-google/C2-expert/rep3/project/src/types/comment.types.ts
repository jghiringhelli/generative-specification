import { ProfileResponseDto } from './auth.types';

/**
 * Representation of a single comment.
 */
export interface CommentResponseDto {
  id: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  body: string;
  author: ProfileResponseDto;
}
