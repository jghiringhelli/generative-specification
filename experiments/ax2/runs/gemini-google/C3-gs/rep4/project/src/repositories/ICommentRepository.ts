import { CommentEntity } from '../types';

export interface ICommentRepository {
  findById(id: string): Promise<CommentEntity | null>;
  findByArticleSlug(slug: string): Promise<CommentEntity[]>;
  create(articleId: string, authorId: string, body: string): Promise<CommentEntity>;
  delete(id: string): Promise<void>;
}
