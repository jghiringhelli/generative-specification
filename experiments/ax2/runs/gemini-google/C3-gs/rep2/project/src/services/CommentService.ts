import { ICommentRepository } from '../repositories/ICommentRepository';
import {
  CreateCommentInput,
  SingleCommentResponseDTO,
  MultipleCommentsResponseDTO,
  CommentResponseData,
} from '../dtos/CommentDTOs';

export class CommentService {
  private readonly commentRepository: ICommentRepository;

  constructor(commentRepository: ICommentRepository) {
    this.commentRepository = commentRepository;
  }

  private formatComment(entity: any): CommentResponseData {
    return {
      id: entity.id,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
      body: entity.body,
      author: entity.author,
    };
  }

  /**
   * Retrieves all comments for a given article slug.
   */
  public async getComments(slug: string, currentUserId?: string): Promise<MultipleCommentsResponseDTO> {
    const comments = await this.commentRepository.findByArticleSlug(slug, currentUserId);
    return {
      comments: comments.map((c) => this.formatComment(c)),
    };
  }

  /**
   * Creates a comment on an article.
   */
  public async createComment(
    slug: string,
    authorId: string,
    input: CreateCommentInput
  ): Promise<SingleCommentResponseDTO> {
    const created = await this.commentRepository.create(slug, authorId, input.body);
    return {
      comment: this.formatComment(created),
    };
  }

  /**
   * Deletes a comment by ID (restricted to the comment author).
   */
  public async deleteComment(id: string, currentUserId: string): Promise<void> {
    await this.commentRepository.delete(id, currentUserId);
  }
}
