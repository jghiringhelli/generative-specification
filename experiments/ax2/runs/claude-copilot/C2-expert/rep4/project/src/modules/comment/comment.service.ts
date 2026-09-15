import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { ArticleRepository } from "../article/article.repository";
import { UserRepository } from "../user/user.repository";
import { CommentRepository, CommentWithAuthor } from "./comment.repository";

/** A comment rendered for API responses. */
export interface CommentView {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/** Response wrapping a single comment. */
export interface SingleCommentResponse {
  comment: CommentView;
}

/** Response wrapping a list of comments. */
export interface CommentListResponse {
  comments: CommentView[];
}

/**
 * Business logic for article comments.
 */
export class CommentService {
  private readonly comments: CommentRepository;
  private readonly articles: ArticleRepository;
  private readonly users: UserRepository;

  /**
   * @param comments Injected comment repository.
   * @param articles Injected article repository.
   * @param users Injected user repository.
   */
  constructor(
    comments: CommentRepository,
    articles: ArticleRepository,
    users: UserRepository,
  ) {
    this.comments = comments;
    this.articles = articles;
    this.users = users;
  }

  /**
   * List comments on an article.
   * @param slug The article slug.
   * @param currentUserId The viewer id, when authenticated.
   * @returns The comment list.
   */
  async list(
    slug: string,
    currentUserId?: number,
  ): Promise<CommentListResponse> {
    const article = await this.requireArticle(slug);
    const rows = await this.comments.listByArticle(article.id);
    const comments = await Promise.all(
      rows.map((row) => this.toView(row, currentUserId)),
    );
    return { comments };
  }

  /**
   * Add a comment to an article.
   * @param slug The article slug.
   * @param body The comment body.
   * @param currentUserId The comment author id.
   * @returns The created comment.
   */
  async add(
    slug: string,
    body: string,
    currentUserId: number,
  ): Promise<SingleCommentResponse> {
    const article = await this.requireArticle(slug);
    const comment = await this.comments.create(
      article.id,
      currentUserId,
      body,
    );
    return { comment: await this.toView(comment, currentUserId) };
  }

  /**
   * Delete a comment the current user authored.
   * @param slug The article slug.
   * @param commentId The comment id.
   * @param currentUserId The requesting user id.
   */
  async delete(
    slug: string,
    commentId: number,
    currentUserId: number,
  ): Promise<void> {
    await this.requireArticle(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new NotFoundError("comment not found");
    }
    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError("you are not the author of this comment");
    }
    await this.comments.delete(commentId);
  }

  /**
   * Load an article by slug or throw 404.
   * @param slug The article slug.
   * @returns The article id container.
   */
  private async requireArticle(slug: string): Promise<{ id: number }> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError("article not found");
    }
    return article;
  }

  /**
   * Map a comment to its API view.
   * @param comment The comment with author.
   * @param currentUserId The viewer id, when authenticated.
   * @returns The comment view.
   */
  private async toView(
    comment: CommentWithAuthor,
    currentUserId: number | undefined,
  ): Promise<CommentView> {
    const following = currentUserId
      ? await this.users.isFollowing(currentUserId, comment.authorId)
      : false;
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following,
      },
    };
  }
}
