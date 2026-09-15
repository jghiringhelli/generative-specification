// src/services/CommentService.ts
import { ICommentRepository } from '../repositories/ICommentRepository';
import { Comment } from '../types';
import { ValidationError, NotFoundError, ForbiddenError } from '../errors/AppError';

export class CommentService {
  private commentRepository: ICommentRepository;

  constructor(commentRepository: ICommentRepository) {
    this.commentRepository = commentRepository;
  }

  async addComment(articleSlug: string, authorId: string, body?: string): Promise<Comment> {
    if (!body || body.trim() === '') {
      throw new ValidationError({ body: ["can't be blank"] });
    }

    return this.commentRepository.create(articleSlug, authorId, body.trim());
  }

  async getComments(articleSlug: string, currentUserId?: string): Promise<Comment[]> {
    return this.commentRepository.findByArticleSlug(articleSlug, currentUserId);
  }

  async deleteComment(commentId: number, currentUserId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(`Comment with id ${commentId} not found`);
    }

    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('You are not authorized to delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }
}
