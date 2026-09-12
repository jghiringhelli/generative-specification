import { Comment } from '../entities/Comment';

export interface CreateCommentData {
  body: string;
  authorId: number;
  articleId: number;
}

export interface ICommentRepository {
  create(data: CreateCommentData): Promise<Comment>;
  findById(id: number): Promise<Comment | null>;
  findByArticleId(articleId: number): Promise<Comment[]>;
  delete(id: number): Promise<void>;
}
