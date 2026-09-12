export interface Comment {
  id: number;
  body: string;
  authorId: number;
  articleId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithAuthor {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}
