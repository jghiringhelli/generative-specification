import { ProfileResponse } from "../profiles/profile.types";

export type CommentRecord = {
  readonly id: number;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly authorId: number;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
  };
};

export type CommentResponse = {
  readonly id: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly body: string;
  readonly author: ProfileResponse;
};
