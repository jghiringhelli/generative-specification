// src/repositories/ICommentRepository.ts

export interface CommentAuthor {
  id: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface CommentRecord {
  id: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  authorId: string;
  author: CommentAuthor;
}

export interface CreateCommentData {
  body: string;
  articleId: string;
  authorId: string;
}

export interface ICommentRepository {
  create(data: CreateCommentData): Promise<CommentRecord>;
  findById(id: string): Promise<CommentRecord | null>;
  delete(id: string): Promise<void>;
  findByArticleSlug(slug: string): Promise<CommentRecord[]>;
}
