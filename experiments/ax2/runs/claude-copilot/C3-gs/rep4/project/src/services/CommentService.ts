import { ICommentRepository } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { CommentView, toCommentView } from '../dto/views';
import { CommentWithAuthor } from '../domain/entities';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

export interface AddCommentInput {
  body: string;
}

export interface CommentsEnvelope {
  comments: CommentView[];
}

/**
 * Business logic for article comments: creation, listing, and authorized deletion.
 */
export class CommentService {
  constructor(
    private readonly comments: ICommentRepository,
    private readonly articles: IArticleRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  /** Add a comment to an article on behalf of the viewer. */
  async addComment(
    slug: string,
    viewerId: string,
    input: AddCommentInput,
  ): Promise<CommentView> {
    const article = await this.requireArticle(slug);
    const comment = await this.comments.create({
      body: input.body,
      articleId: article.id,
      authorId: viewerId,
    });
    return this.present(comment, viewerId);
  }

  /** List all comments for an article. */
  async listComments(slug: string, viewerId: string | null): Promise<CommentsEnvelope> {
    const article = await this.requireArticle(slug);
    const comments = await this.comments.listByArticle(article.id);
    const views = await Promise.all(
      comments.map((comment) => this.present(comment, viewerId)),
    );
    return { comments: views };
  }

  /** Delete a comment; only its author may do so. */
  async deleteComment(slug: string, commentId: number, viewerId: string): Promise<void> {
    await this.requireArticle(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new NotFoundError('comment not found');
    }
    if (comment.authorId !== viewerId) {
      throw new ForbiddenError('you are not the author of this comment');
    }
    await this.comments.delete(commentId);
  }

  private async requireArticle(slug: string) {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article not found');
    }
    return article;
  }

  private async present(comment: CommentWithAuthor, viewerId: string | null): Promise<CommentView> {
    const following = viewerId
      ? await this.profiles.isFollowing(viewerId, comment.authorId)
      : false;
    return toCommentView(comment, following);
  }
}
