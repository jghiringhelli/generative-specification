import { ProfileData } from './profile.types';

export interface CommentData {
  readonly id: number;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
  readonly body: string;
  readonly author: ProfileData;
}

export interface SingleCommentResponse {
  readonly comment: CommentData;
}

export interface MultipleCommentsResponse {
  readonly comments: readonly CommentData[];
}

export interface CreateCommentInput {
  readonly body: string;
}
