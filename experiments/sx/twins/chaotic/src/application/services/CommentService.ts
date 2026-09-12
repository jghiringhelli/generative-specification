import { ICommentRepository } from '../../domain/repositories/ICommentRepository';
import { IArticleRepository } from '../../domain/repositories/IArticleRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { CommentWithAuthor } from '../../domain/entities/Comment';

export class CommentService {
  constructor(
    private commentRepository: ICommentRepository,
    private articleRepository: IArticleRepository,
    private userRepository: IUserRepository
  ) {}

  async getComments(slug: string, currentUserId?: number): Promise<CommentWithAuthor[] | null> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return null;
    }

    const comments = await this.commentRepository.findByArticleId(article.id);

    return await Promise.all(
      comments.map(comment => this.buildCommentResponse(comment, currentUserId))
    );
  }

  async addComment(slug: string, body: string, currentUserId: number): Promise<CommentWithAuthor | null> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return null;
    }

    const comment = await this.commentRepository.create({
      body,
      authorId: currentUserId,
      articleId: article.id
    });

    return await this.buildCommentResponse(comment, currentUserId);
  }

  async deleteComment(slug: string, commentId: number, currentUserId: number): Promise<boolean> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('article not found');
    }

    const comment = await this.commentRepository.findById(commentId);

    if (!comment || comment.articleId !== article.id) {
      throw new Error('comment not found');
    }

    if (comment.authorId !== currentUserId) {
      throw new Error('comment forbidden');
    }

    await this.commentRepository.delete(commentId);
    return true;
  }

  private async buildCommentResponse(comment: any, currentUserId?: number): Promise<CommentWithAuthor> {
    const author = await this.userRepository.findById(comment.authorId);

    let following = false;
    if (currentUserId && author) {
      following = await this.userRepository.isFollowing(currentUserId, author.id);
    }

    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: author!.username,
        bio: author!.bio,
        image: author!.image,
        following
      }
    };
  }

  /**
   * Maps an article row into the stub shown on the profile timeline next to a
   * user's comments.
   * @param article the raw article row
   */
  private mapArticle(article: any): any {
    return {
      slug: article.slug,
      title: article.title,
      author: article.author ? article.author.username : ''
    };
  }
}
