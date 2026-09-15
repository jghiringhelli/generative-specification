import { CommentRepository, commentRepository, CommentWithAuthor } from '../repositories/comment.repository';
import { ArticleRepository, articleRepository } from '../repositories/article.repository';
import { ProfileRepository, profileRepository } from '../repositories/profile.repository';
import { NotFoundError, ForbiddenError } from '../lib/errors';
import { CommentResponse, CommentsResponse, CommentItem } from '../types';

export class CommentService {
  constructor(
    private commentRepo: CommentRepository = commentRepository,
    private articleRepo: ArticleRepository = articleRepository,
    private profileRepo: ProfileRepository = profileRepository
  ) {}

  private async formatCommentItem(
    comment: CommentWithAuthor,
    currentUserId?: number
  ): Promise<CommentItem> {
    let following = false;
    if (currentUserId && currentUserId !== comment.author.id) {
      following = await this.profileRepo.isFollowing(currentUserId, comment.author.id);
    }

    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following
      }
    };
  }

  async getComments(slug: string, currentUserId?: number): Promise<CommentsResponse> {
    const article = await this.articleRepo.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    const comments = await this.commentRepo.findByArticleId(article.id);
    const formatted = await Promise.all(
      comments.map((c) => this.formatCommentItem(c, currentUserId))
    );

    return {
      comments: formatted
    };
  }

  async addComment(slug: string, authorId: number, body: string): Promise<CommentResponse> {
    const article = await this.articleRepo.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    const comment = await this.commentRepo.create(article.id, authorId, body);
    const formatted = await this.formatCommentItem(comment, authorId);

    return {
      comment: formatted
    };
  }

  async deleteComment(slug: string, commentId: number, currentUserId: number): Promise<void> {
    const article = await this.articleRepo.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    const comment = await this.commentRepo.findById(commentId);
    if (!comment) {
      throw new NotFoundError(`Comment with id '${commentId}' not found`);
    }

    if (comment.articleId !== article.id) {
      throw new NotFoundError('Comment does not belong to this article');
    }

    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('You are not authorized to delete this comment');
    }

    await this.commentRepo.delete(commentId);
  }
}

export const commentService = new CommentService();
