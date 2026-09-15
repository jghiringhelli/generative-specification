// src/repositories/ICommentRepository.ts

export interface CommentEntity {
  id: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  articleId: string;
}

export interface CreateCommentData {
  body: string;
  authorId: string;
  articleId: string;
}

export interface ICommentRepository {
  findById(id: string): Promise<CommentEntity | null>;
  findByArticleSlug(slug: string): Promise<CommentEntity[]>;
  create(data: CreateCommentData): Promise<CommentEntity>;
  delete(id: string): Promise<void>;
}
