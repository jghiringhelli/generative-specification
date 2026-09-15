import { CommentService } from '../../src/services/CommentService';
import {
  CommentEntity,
  CreateCommentData,
  ICommentRepository,
} from '../../src/repositories/ICommentRepository';
import {
  ArticleEntity,
  ArticleFeedOptions,
  ArticleQueryOptions,
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from '../../src/repositories/IArticleRepository';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from '../../src/repositories/IUserRepository';
import {
  IProfileRepository,
  ProfileEntity,
} from '../../src/repositories/IProfileRepository';
import { ForbiddenError, NotFoundError } from '../../src/errors/AppError';

class FakeCommentRepository implements ICommentRepository {
  private comments: CommentEntity[] = [];

  async findById(id: string): Promise<CommentEntity | null> {
    return this.comments.find((c) => c.id === id) ?? null;
  }

  async findByArticleSlug(_slug: string): Promise<CommentEntity[]> {
    return this.comments;
  }

  async create(data: CreateCommentData): Promise<CommentEntity> {
    const comment: CommentEntity = {
      id: `comment-${Date.now()}-${Math.random()}`,
      body: data.body,
      authorId: data.authorId,
      articleId: data.articleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.comments.push(comment);
    return comment;
  }

  async delete(id: string): Promise<void> {
    this.comments = this.comments.filter((c) => c.id !== id);
  }
}

class FakeArticleRepository implements IArticleRepository {
  public articles: ArticleEntity[] = [];

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    return this.articles.find((a) => a.slug === slug) ?? null;
  }
  async list(_options: ArticleQueryOptions): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    return { articles: this.articles, articlesCount: this.articles.length };
  }
  async listFeed(_userId: string, _options: ArticleFeedOptions): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    return { articles: this.articles, articlesCount: this.articles.length };
  }
  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const article: ArticleEntity = {
      id: 'article-1',
      slug: 'test-article',
      title: data.title,
      description: data.description,
      body: data.body,
      tagList: data.tagList ?? [],
      authorId: data.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.articles.push(article);
    return article;
  }
  async update(_slug: string, _data: UpdateArticleData): Promise<ArticleEntity> {
    return this.articles[0];
  }
  async delete(_slug: string): Promise<void> {}
  async favorite(_articleId: string, _userId: string): Promise<void> {}
  async unfavorite(_articleId: string, _userId: string): Promise<void> {}
  async isFavorited(_articleId: string, _userId: string): Promise<boolean> {
    return false;
  }
  async getFavoritesCount(_articleId: string): Promise<number> {
    return 0;
  }
}

class FakeUserRepository implements IUserRepository {
  public users: UserEntity[] = [];
  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.username === username) ?? null;
  }
  async create(data: CreateUserData): Promise<UserEntity> {
    const user: UserEntity = {
      id: `user-${Date.now()}-${Math.random()}`,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: '',
      image: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const u = await this.findById(id);
    Object.assign(u!, data);
    return u!;
  }
}

class FakeProfileRepository implements IProfileRepository {
  async findByUsername(_username: string): Promise<ProfileEntity | null> {
    return null;
  }
  async follow(_followerId: string, _followingId: string): Promise<void> {}
  async unfollow(_followerId: string, _followingId: string): Promise<void> {}
  async isFollowing(_followerId: string, _followingId: string): Promise<boolean> {
    return false;
  }
}

describe('CommentService', () => {
  let commentRepo: FakeCommentRepository;
  let articleRepo: FakeArticleRepository;
  let userRepo: FakeUserRepository;
  let profileRepo: FakeProfileRepository;
  let service: CommentService;
  let author: UserEntity;
  let article: ArticleEntity;

  beforeEach(async () => {
    commentRepo = new FakeCommentRepository();
    articleRepo = new FakeArticleRepository();
    userRepo = new FakeUserRepository();
    profileRepo = new FakeProfileRepository();
    service = new CommentService(commentRepo, articleRepo, userRepo, profileRepo);

    author = await userRepo.create({
      username: 'jake',
      email: 'jake@example.com',
      passwordHash: 'hash',
    });

    article = await articleRepo.create({
      title: 'Article 1',
      description: 'Desc',
      body: 'Body',
      authorId: author.id,
    });
  });

  describe('createComment & getComments', () => {
    it('creates a comment and lists comments for article', async () => {
      const created = await service.createComment(
        article.slug,
        { body: 'Great read!' },
        author.id
      );

      expect(created.body).toBe('Great read!');
      expect(created.author.username).toBe('jake');

      const comments = await service.getComments(article.slug);
      expect(comments.length).toBe(1);
      expect(comments[0].body).toBe('Great read!');
    });

    it('throws NotFoundError when commenting on non-existent article', async () => {
      await expect(
        service.createComment('unknown-slug', { body: 'text' }, author.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment', () => {
    it('allows author to delete comment', async () => {
      const created = await service.createComment(
        article.slug,
        { body: 'Delete this' },
        author.id
      );

      await service.deleteComment(article.slug, created.id, author.id);
      const comments = await service.getComments(article.slug);
      expect(comments.length).toBe(0);
    });

    it('throws ForbiddenError when non-author attempts delete', async () => {
      const created = await service.createComment(
        article.slug,
        { body: 'Delete this' },
        author.id
      );

      await expect(
        service.deleteComment(article.slug, created.id, 'intruder-id')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
