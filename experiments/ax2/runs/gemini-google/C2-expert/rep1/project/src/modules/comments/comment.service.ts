import { ICommentRepository, CommentRepository, CommentWithAuthor } from './comment.repository';
import { IArticleRepository, ArticleRepository } from '../articles/article.repository';
import { IProfileRepository, ProfileRepository } from '../profiles/profile.repository';
import { CreateCommentInput, CommentData } from './comment.dto';
import { ForbiddenError, NotFoundError } from '../../errors/app-error';

export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository = new CommentRepository(),
    private readonly articleRepository: IArticleRepository = new ArticleRepository(),
    private readonly profileRepository: IProfileRepository = new ProfileRepository()
  ) {}

  async getComments(slug: string, currentUserId?: string): Promise<CommentData[]> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    const comments = await this.commentRepository.findByArticleId(article.id);

    return Promise.all(
      comments.map((comment) => this.buildCommentData(comment, currentUserId))
    );
  }

  async addComment(
    slug: string,
    userId: string,
    input: CreateCommentInput
  ): Promise<CommentData> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    const comment = await this.commentRepository.create({
      body: input.comment.body,
      articleId: article.id,
      authorId: userId
    });

    return this.buildCommentData(comment, userId);
  }

  async deleteComment(slug: string, commentId: number, currentUserId: string): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(`Comment with id '${commentId}' not found`);
    }

    if (comment.articleId !== article.id) {
      throw new NotFoundError(`Comment does not belong to article '${slug}'`);
    }

    if (comment.authorId !== currentUserId) {
      throw new ForbiddenError('You are not authorized to delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }

  private async buildCommentData(
    comment: CommentWithAuthor,
    currentUserId?: string
  ): Promise<CommentData> {
    let following = false;
    if (currentUserId && currentUserId !== comment.authorId) {
      following = await this.profileRepository.isFollowing(currentUserId, comment.authorId);
    }

    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
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
