import { AuthorProfile } from './IArticleRepository';

export interface CommentEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: AuthorProfile;
}

export interface ICommentRepository {
  findById(id: string): Promise<(CommentEntity & { authorId: string; articleId: string }) | null>;
  findByArticleSlug(slug: string, currentUserId?: string): Promise<CommentEntity[]>;
  create(slug: string, authorId: string, body: string): Promise<CommentEntity>;
  delete(id: string, currentUserId: string): Promise<void>;
}
