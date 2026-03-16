import { CommentRepository, CommentWithRelations } from '../repositories/commentRepository';
import { ArticleRepository } from '../repositories/articleRepository';
import { ProfileRepository } from '../repositories/profileRepository';

export interface CommentResponse {
  id: string;
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

export class CommentService {
  constructor(
    private commentRepository: CommentRepository,
    private articleRepository: ArticleRepository,
    private profileRepository: ProfileRepository
  ) {}

  async addComment(
    slug: string,
    userId: string,
    body: string
  ): Promise<CommentResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('Article not found');
    }

    const comment = await this.commentRepository.create(
      article.id,
      userId,
      body
    );

    return this.toCommentResponse(comment, userId);
  }

  async getComments(
    slug: string,
    currentUserId?: string
  ): Promise<CommentResponse[]> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('Article not found');
    }

    const comments = await this.commentRepository.findByArticleId(article.id);

    return Promise.all(
      comments.map(comment => this.toCommentResponse(comment, currentUserId))
    );
  }

  async deleteComment(
    slug: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('Article not found');
    }

    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('Forbidden: You are not the author of this comment');
    }

    await this.commentRepository.delete(commentId);
  }

  private async toCommentResponse(
    comment: CommentWithRelations,
    currentUserId?: string
  ): Promise<CommentResponse> {
    const following = currentUserId
      ? await this.profileRepository.isFollowing(currentUserId, comment.authorId)
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
        following
      }
    };
  }
}
