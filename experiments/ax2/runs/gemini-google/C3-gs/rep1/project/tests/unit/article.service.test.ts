import { ArticleService } from '../../src/services/ArticleService';
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

class FakeUserRepository implements IUserRepository {
  private users: UserEntity[] = [];

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
      bio: data.bio ?? '',
      image: data.image ?? '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new Error('Not found');
    Object.assign(user, data);
    return user;
  }
}

class FakeProfileRepository implements IProfileRepository {
  private follows = new Set<string>();

  async findByUsername(_username: string): Promise<ProfileEntity | null> {
    return null;
  }
  async follow(followerId: string, followingId: string): Promise<void> {
    this.follows.add(`${followerId}:${followingId}`);
  }
  async unfollow(followerId: string, followingId: string): Promise<void> {
    this.follows.delete(`${followerId}:${followingId}`);
  }
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.follows.has(`${followerId}:${followingId}`);
  }
}

class FakeArticleRepository implements IArticleRepository {
  private articles: ArticleEntity[] = [];
  private favorites = new Set<string>(); // key: articleId:userId

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    return this.articles.find((a) => a.slug === slug) ?? null;
  }

  async list(
    options: ArticleQueryOptions
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    let result = [...this.articles];
    if (options.tag) {
      result = result.filter((a) => a.tagList.includes(options.tag!));
    }
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    return {
      articles: result.slice(offset, offset + limit),
      articlesCount: result.length,
    };
  }

  async listFeed(
    _userId: string,
    options: ArticleFeedOptions
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    return {
      articles: this.articles.slice(offset, offset + limit),
      articlesCount: this.articles.length,
    };
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const article: ArticleEntity = {
      id: `article-${Date.now()}-${Math.random()}`,
      slug: data.title.toLowerCase().replace(/\s+/g, '-'),
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

  async update(slug: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    if (!article) throw new Error('Not found');
    if (data.title) {
      article.title = data.title;
      article.slug = data.title.toLowerCase().replace(/\s+/g, '-');
    }
    if (data.description) article.description = data.description;
    if (data.body) article.body = data.body;
    article.updatedAt = new Date();
    return article;
  }

  async delete(slug: string): Promise<void> {
    this.articles = this.articles.filter((a) => a.slug !== slug);
  }

  async favorite(articleId: string, userId: string): Promise<void> {
    this.favorites.add(`${articleId}:${userId}`);
  }

  async unfavorite(articleId: string, userId: string): Promise<void> {
    this.favorites.delete(`${articleId}:${userId}`);
  }

  async isFavorited(articleId: string, userId: string): Promise<boolean> {
    return this.favorites.has(`${articleId}:${userId}`);
  }

  async getFavoritesCount(articleId: string): Promise<number> {
    let count = 0;
    for (const key of this.favorites) {
      if (key.startsWith(`${articleId}:`)) count++;
    }
    return count;
  }
}

describe('ArticleService', () => {
  let articleRepo: FakeArticleRepository;
  let userRepo: FakeUserRepository;
  let profileRepo: FakeProfileRepository;
  let articleService: ArticleService;
  let author: UserEntity;

  beforeEach(async () => {
    articleRepo = new FakeArticleRepository();
    userRepo = new FakeUserRepository();
    profileRepo = new FakeProfileRepository();
    articleService = new ArticleService(articleRepo, userRepo, profileRepo);

    author = await userRepo.create({
      username: 'jake',
      email: 'jake@example.com',
      passwordHash: 'hash',
    });
  });

  describe('createArticle & getArticle', () => {
    it('creates an article with body and retrieves it', async () => {
      const created = await articleService.createArticle(
        {
          title: 'How to train your dragon',
          description: 'Ever wonder how?',
          body: 'It takes a Jacobian',
          tagList: ['dragons', 'training'],
        },
        author.id
      );

      expect(created.title).toBe('How to train your dragon');
      expect(created.slug).toBe('how-to-train-your-dragon');
      expect(created.body).toBe('It takes a Jacobian');
      expect(created.author.username).toBe('jake');

      const fetched = await articleService.getArticle(created.slug);
      expect(fetched.slug).toBe(created.slug);
      expect(fetched.body).toBe('It takes a Jacobian');
    });

    it('throws NotFoundError if article not found', async () => {
      await expect(articleService.getArticle('nonexistent-slug')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('listArticles', () => {
    it('omits body field in list responses for performance spec', async () => {
      await articleService.createArticle(
        {
          title: 'Article 1',
          description: 'Desc 1',
          body: 'Secret Body 1',
          tagList: ['tag1'],
        },
        author.id
      );

      const listResult = await articleService.listArticles({ limit: 10, offset: 0 });
      expect(listResult.articlesCount).toBe(1);
      expect((listResult.articles[0] as any).body).toBeUndefined();
      expect(listResult.articles[0].title).toBe('Article 1');
    });
  });

  describe('updateArticle', () => {
    it('allows author to update title and body', async () => {
      const created = await articleService.createArticle(
        {
          title: 'Original Title',
          description: 'Original Desc',
          body: 'Original Body',
        },
        author.id
      );

      const updated = await articleService.updateArticle(
        created.slug,
        { title: 'Updated Title' },
        author.id
      );

      expect(updated.title).toBe('Updated Title');
    });

    it('throws ForbiddenError when non-author attempts update', async () => {
      const created = await articleService.createArticle(
        {
          title: 'Original Title',
          description: 'Original Desc',
          body: 'Original Body',
        },
        author.id
      );

      await expect(
        articleService.updateArticle(
          created.slug,
          { title: 'Hacked Title' },
          'intruder-user-id'
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteArticle', () => {
    it('allows author to delete article', async () => {
      const created = await articleService.createArticle(
        {
          title: 'To Be Deleted',
          description: 'Desc',
          body: 'Body',
        },
        author.id
      );

      await articleService.deleteArticle(created.slug, author.id);
      await expect(articleService.getArticle(created.slug)).rejects.toThrow(
        NotFoundError
      );
    });

    it('throws ForbiddenError when non-author attempts deletion', async () => {
      const created = await articleService.createArticle(
        {
          title: 'Protected Article',
          description: 'Desc',
          body: 'Body',
        },
        author.id
      );

      await expect(
        articleService.deleteArticle(created.slug, 'intruder-id')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('favorite & unfavorite', () => {
    it('favorites and unfavorites an article', async () => {
      const created = await articleService.createArticle(
        {
          title: 'Favorite Me',
          description: 'Desc',
          body: 'Body',
        },
        author.id
      );

      const fav = await articleService.favoriteArticle(created.slug, author.id);
      expect(fav.favorited).toBe(true);
      expect(fav.favoritesCount).toBe(1);

      const unfav = await articleService.unfavoriteArticle(created.slug, author.id);
      expect(unfav.favorited).toBe(false);
      expect(unfav.favoritesCount).toBe(0);
    });
  });
});
