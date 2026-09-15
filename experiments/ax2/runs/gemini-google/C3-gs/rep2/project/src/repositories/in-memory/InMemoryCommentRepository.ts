import { ICommentRepository, CommentEntity } from '../ICommentRepository';
import { IUserRepository } from '../IUserRepository';
import { IProfileRepository } from '../IProfileRepository';
import { IArticleRepository } from '../IArticleRepository';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';

interface StoredComment {
  id: string;
  articleSlug: string;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryCommentRepository implements ICommentRepository {
  private readonly userRepository: IUserRepository;
  private readonly profileRepository: IProfileRepository;
  private readonly articleRepository: IArticleRepository;
  private comments: Map<string, StoredComment> = new Map();
  private nextId = 1;

  constructor(
    userRepository: IUserRepository,
    profileRepository: IProfileRepository,
    articleRepository: IArticleRepository
  ) {
    this.userRepository = userRepository;
    this.profileRepository = profileRepository;
    this.articleRepository = articleRepository;
  }

  private async toCommentEntity(stored: StoredComment, currentUserId?: string): Promise<CommentEntity> {
    const author = await this.userRepository.findById(stored.authorId);
    const profile = await this.profileRepository.getProfile(author?.username || 'unknown', currentUserId);

    return {
      id: stored.id,
      body: stored.body,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
      author: profile || {
        username: author?.username || 'unknown',
        bio: author?.bio || null,
        image: author?.image || null,
        following: false,
      },
    };
  }

  async findById(id: string): Promise<(CommentEntity & { authorId: string; articleId: string }) | null> {
    const stored = this.comments.get(id);
    if (!stored) return null;
    const entity = await this.toCommentEntity(stored);
    return {
      ...entity,
      authorId: stored.authorId,
      articleId: stored.articleSlug,
    };
  }

  async findByArticleSlug(slug: string, currentUserId?: string): Promise<CommentEntity[]> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const matching = [...this.comments.values()]
      .filter((c) => c.articleSlug === slug)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.all(matching.map((c) => this.toCommentEntity(c, currentUserId)));
  }

  async create(slug: string, authorId: string, body: string): Promise<CommentEntity> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const id = `${this.nextId++}`;
    const now = new Date();
    const stored: StoredComment = {
      id,
      articleSlug: slug,
      authorId,
      body,
      createdAt: now,
      updatedAt: now,
    };

    this.comments.set(id, stored);
    return this.toCommentEntity(stored, authorId);
  }

  async delete(id: string, currentUserId: string): Promise<void> {
    const stored = this.comments.get(id);
    if (!stored) {
      throw new NotFoundError('Comment not found');
    }

    if (stored.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this comment');
    }

    this.comments.delete(id);
  }

  clear(): void {
    this.comments.clear();
    this.nextId = 1;
  }
}
