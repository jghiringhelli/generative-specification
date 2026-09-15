// src/services/CommentService.ts
import { ICommentRepository, CommentRecord } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { ValidationError, NotFoundError, ForbiddenError } from '../errors/AppError';

export interface CommentResponseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly articleRepository: IArticleRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  private async toCommentDto(
    record: CommentRecord,
    currentUserId?: string
  ): Promise<CommentResponseDto> {
    let following = false;
    if (currentUserId && record.authorId !== currentUserId) {
      following = await this.profileRepository.isFollowing(currentUserId, record.authorId);
    }

    return {
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      body: record.body,
      author: {
        username: record.author.username,
        bio: record.author.bio,
        image: record.author.image,
        following
      }
    };
  }

  public async addComment(
    userId: string,
    slug: string,
    body?: string
  ): Promise<CommentResponseDto> {
    if (!body || !body.trim()) {
      throw new ValidationError('Validation failed', {
        body: ["can't be blank"]
      });
    }

    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const comment = await this.commentRepository.create({
      articleId: article.id,
      authorId: userId,
      body: body.trim()
    });

    return this.toCommentDto(comment, userId);
  }

  public async getComments(slug: string, currentUserId?: string): Promise<CommentResponseDto[]> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const comments = await this.commentRepository.findByArticleSlug(slug);
    return Promise.all(comments.map(c => this.toCommentDto(c, currentUserId)));
  }

  public async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(`Comment '${commentId}' not found`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await this.commentRepository.delete(commentId);
  }
}
