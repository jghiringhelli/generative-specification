import { Comment } from '@prisma/client';

export interface CreateCommentData {
  body: string;
  authorId: number;
  articleSlug: string;
}

export interface ICommentRepository {
  findById(id: number, currentUserId?: number): Promise<Comment | null>;
  findByArticleSlug(slug: string, currentUserId?: number): Promise<Comment[]>;
  create(data: CreateCommentData, currentUserId?: number): Promise<Comment>;
  delete(id: number): Promise<void>;
}
