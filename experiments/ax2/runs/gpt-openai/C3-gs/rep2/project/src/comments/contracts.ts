import { ProfileResponse } from '../profiles/contracts';

export interface CommentResponse {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly body: string;
  readonly author: ProfileResponse;
}
