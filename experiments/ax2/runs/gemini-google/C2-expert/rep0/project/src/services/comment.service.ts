import { ICommentRepository, CommentRepository } from '../repositories/comment.repository';
import { IArticleRepository, ArticleRepository } from '../repositories/article.repository';
import { IProfileRepository, ProfileRepository } from '../repositories/profile.repository';
import {
  CreateCommentInput,
  SingleCommentResponse,
  MultipleCommentsResponse,
  CommentData
} from '../types/comment.types';
import { NotFoundError, ForbiddenError } from '../utils/error.util';

export interface ICommentService {
  addComment(slug: string, authorId: number, input: CreateCommentInput): Promise<SingleCommentResponse>;
  getComments(slug: string, currentUserId?: number): Promise<MultipleCommentsResponse>;
  deleteComment(slug: string, commentId: number, currentUserId: number): Promise<void>;
}

export class CommentService implements ICommentService {
  private readonly commentRepository: ICommentRepository;
  private readonly articleRepository: IArticleRepository;
  private readonly profileRepository: IProfileRepository;

  constructor(
    commentRepository: ICommentRepository = new CommentRepository(),
    articleRepository: IArticleRepository = new ArticleRepository(),
    profileRepository: IProfileRepository = new ProfileRepository()
  ) {
    this.commentRepository = commentRepository;
    this.articleRepository = articleRepository;
    this.profileRepository = profileRepository;
  }

  public async addComment(
    slug: string,
    authorId: number,
    input: CreateCommentInput
  ): Promise<SingleCommentResponse> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const created = await this.commentRepository.create(article.id, authorId, input.body);
    const authorProfile = await this.profileRepository.findProfileByUsername(
      created.author.username,
      authorId
    );

    const commentData: CommentData = {
      id: created.id,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      body: created.body,
      author: authorProfile || {
        username: created.author.username,
        bio: created.author.bio,
        image: created.author.image,
        following: false
      }
    };

    return { comment: commentData };
  }

  public async getComments(slug: string, currentUserId?: number): Promise<MultipleCommentsResponse> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const comments = await this.commentRepository.findByArticleId(article.id);
    const commentList: CommentData[] = await Promise.all(
      comments.map(async (c) => {
        const profile = await this.profileRepository.findProfileByUsername(
          c.author.username,
          currentUserId
        );
        return {
          id: c.id,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          body: c.body,
          author: profile || {
            username: c.author.username,
            bio: c.author.bio,
            image: c.author.image,
            following: false
          }
        };
      })
    );

    return { comments: commentList };
  }

  public async deleteComment(slug: string, commentId: number, currentUserId: number): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

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
