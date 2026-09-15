import { ProfileResponse } from '../profiles/profile.types';

export interface CommentRecord {
  readonly id: number;
  readonly body: string;
  readonly authorId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly followers: ReadonlyArray<unknown>;
  };
}

export interface CommentResponse {
  readonly id: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly body: string;
  readonly author: ProfileResponse;
}
