import { ICommentRepository, CommentEntity } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { CreateCommentInput } from '../validators/comment.validator';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { AuthorDTO } from './ArticleService';

export interface CommentDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: AuthorDTO;
}

export class CommentService {
  private readonly commentRepository: ICommentRepository;
  private readonly articleRepository: IArticleRepository;
  private readonly userRepository: IUserRepository;
  private readonly profileRepository: IProfileRepository;

  constructor(
    commentRepository: ICommentRepository,
    articleRepository: IArticleRepository,
    userRepository: IUserRepository,
    profileRepository: IProfileRepository
  ) {
    this.commentRepository = commentRepository;
    this.articleRepository = articleRepository;
    this.userRepository = userRepository;
    this.profileRepository = profileRepository;
  }

  private async buildAuthorDTO(
    authorId: string,
    currentUserId?: string
  ): Promise<AuthorDTO> {
    const author = await this.userRepository.findById(authorId);
    if (!author) {
      return {
        username: 'unknown',
        bio: '',
        image: '',
        following: false,
      };
    }

    let following = false;
    if (currentUserId && currentUserId !== author.id) {
      following = await this.profileRepository.isFollowing(currentUserId, author.id);
    }

    return {
      username: author.username,
      bio: author.bio ?? '',
      image: author.image ?? '',
      following,
    };
  }

  private async toCommentDTO(
    comment: CommentEntity,
    currentUserId?: string
  ): Promise<CommentDTO> {
    const author = await this.buildAuthorDTO(comment.authorId, currentUserId);
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author,
    };
  }

  async getComments(slug: string, currentUserId?: string): Promise<CommentDTO[]> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const comments = await this.commentRepository.findByArticleSlug(slug);
    return Promise.all(comments.map((c) => this.toCommentDTO(c, currentUserId)));
  }

  async createComment(
    slug: string,
    input: CreateCommentInput,
    authorId: string
  ): Promise<CommentDTO> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const created = await this.commentRepository.create({
      body: input.body,
      authorId,
      articleId: article.id,
    });

    return this.toCommentDTO(created, authorId);
  }

  async deleteComment(
    slug: string,
    commentId: string,
    currentUserId: string
  ): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(`Comment '${commentId}' not found`);
    }

    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }
}
