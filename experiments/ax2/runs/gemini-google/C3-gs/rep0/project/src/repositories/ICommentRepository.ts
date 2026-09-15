// src/repositories/ICommentRepository.ts
import { Comment } from '../types';

export interface CommentEntity {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  authorId: string;
}

export interface ICommentRepository {
  create(articleSlug: string, authorId: string, body: string): Promise<Comment>;
  findByArticleSlug(articleSlug: string, currentUserId?: string): Promise<Comment[]>;
  findById(id: number): Promise<CommentEntity | null>;
  delete(id: number): Promise<void>;
}
