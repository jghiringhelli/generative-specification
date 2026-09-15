import { ICommentRepository } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import {
  CommentResponse,
  CommentsResponse,
  CommentView,
} from '../types/responses';
import { Comment } from '../types/domain';
import { CreateCommentRequest } from '../validators/articleSchemas';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

/** Orchestrates listing, creating, and deleting article comments. */
export class CommentService {
  constructor(
    private readonly comments: ICommentRepository,
    private readonly articles: IArticleRepository,
    private readonly users: IUserRepository,
    private readonly follows: IProfileRepository,
  ) {}

  private async buildView(
    comment: Comment,
    viewerId: number | null,
  ): Promise<CommentView> {
    const author = await this.users.findById(comment.authorId);
    if (!author) {
      throw new NotFoundError('Comment author not found');
    }
    const following =
      viewerId !== null
        ? await this.follows.isFollowing(viewerId, author.id)
        : false;
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following,
      },
    };
  }

  private async requireArticleId(slug: string): Promise<number> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article.id;
  }

  async list(
    slug: string,
    viewerId: number | null,
  ): Promise<CommentsResponse> {
    const articleId = await this.requireArticleId(slug);
    const comments = await this.comments.findByArticleId(articleId);
    const views = await Promise.all(
      comments.map((c) => this.buildView(c, viewerId)),
    );
    return { comments: views };
  }

  async create(
    slug: string,
    input: CreateCommentRequest,
    authorId: number,
  ): Promise<CommentResponse> {
    const articleId = await this.requireArticleId(slug);
    const comment = await this.comments.create({
      body: input.comment.body,
      articleId,
      authorId,
    });
    return { comment: await this.buildView(comment, authorId) };
  }

  async delete(slug: string, commentId: number, userId: number): Promise<void> {
    await this.requireArticleId(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenError('You are not the author of this comment');
    }
    await this.comments.delete(commentId);
  }
}
