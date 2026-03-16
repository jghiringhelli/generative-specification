import { ArticleService } from './article.service';
import { IArticleRepository, ArticleEntity, ArticleListResult } from '../repositories/IArticleRepository';
import { IUserRepository, UserEntity } from '../repositories/IUserRepository';
import { NotFoundError, AuthorizationError } from '../errors/AppError';

// Mock repositories
class MockArticleRepository implements IArticleRepository {
  private articles: ArticleEntity[] = [];
  private nextId = 1;

  addArticle(article: Partial<ArticleEntity>): ArticleEntity {
    const full: ArticleEntity = {
      id: this.nextId++,
      slug: article.slug || 'test-slug',
      title: article.title || 'Test Title',
      description: article.description || 'Test description',
      body: article.body || 'Test body',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: article.author || { username: 'test', bio: null, image: null, following: false },
      tagList: article.tagList || [],
      favorited: false,
      favoritesCount: 0
    };
    this.articles.push(full);
    return full;
  }

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    return this.articles.find(a => a.slug === slug) || null;
  }

  async slugExists(slug: string): Promise<boolean> {
    return this.articles.some(a => a.slug === slug);
  }

  async create(data: any): Promise<ArticleEntity> {
    const article: ArticleEntity = {
      id: this.nextId++,
      slug: data.slug,
      title: data.title,
      description: data.description,
      body: data.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { username: 'author', bio: null, image: null, following: false },
      tagList: data.tagList,
      favorited: false,
      favoritesCount: 0
    };
    this.articles.push(article);
    return article;
  }

  async update(slug: string, data: any): Promise<ArticleEntity> {
    const article = this.articles.find(a => a.slug === slug);
    if (!article) throw new Error('Not found');
    
    Object.assign(article, {
      title: data.title || article.title,
      description: data.description || article.description,
      body: data.body || article.body,
      slug: data.slug || article.slug,
      updatedAt: new Date()
    });
    return article;
  }

  async delete(slug: string): Promise<void> {
    this.articles = this.articles.filter(a => a.slug !== slug);
  }

  async list(): Promise<ArticleListResult> {
    return {
      articles: this.articles.map(a => {
        const { body, ...rest } = a;
        return rest;
      }),
      articlesCount: this.articles.length
    };
  }

  async getFeed(): Promise<ArticleListResult> {
    return { articles: [], articlesCount: 0 };
  }

  async favorite(slug: string): Promise<ArticleEntity> {
    const article = this.articles.find(a => a.slug === slug);
    if (!article) throw new Error('Not found');
    article.favorited = true;
    article.favoritesCount++;
    return article;
  }

  async unfavorite(slug: string): Promise<ArticleEntity> {
    const article = this.articles.find(a => a.slug === slug);
    if (!article) throw new Error('Not found');
    article.favorited = false;
    article.favoritesCount = Math.max(0, article.favoritesCount - 1);
    return article;
  }
}

class MockUserRepository implements IUserRepository {
  private users: Map<number, UserEntity> = new Map();

  addUser(user: UserEntity): void {
    this.users.set(user.id, user);
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(): Promise<UserEntity | null> { return null; }
  async findByUsername(): Promise<UserEntity | null> { return null; }
  async create(): Promise<UserEntity> { throw new Error('Not implemented'); }
  async update(): Promise<UserEntity> { throw new Error('Not implemented'); }
  async isFollowing(): Promise<boolean> { return false; }
  async follow(): Promise<void> {}
  async unfollow(): Promise<void> {}
}

describe('ArticleService', () => {
  let articleService: ArticleService;
  let mockArticleRepo: MockArticleRepository;
  let mockUserRepo: MockUserRepository;

  beforeEach(() => {
    mockArticleRepo = new MockArticleRepository();
    mockUserRepo = new MockUserRepository();
    articleService = new ArticleService(mockArticleRepo, mockUserRepo);

    mockUserRepo.addUser({
      id: 1,
      email: 'author@example.com',
      username: 'author',
      passwordHash: 'hash',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  describe('getArticle', () => {
    it('get_existing_article_returns_article_with_body', async () => {
      mockArticleRepo.addArticle({
        slug: 'test-article',
        title: 'Test Article',
        body: 'Article body content'
      });

      const article = await articleService.getArticle('test-article');

      expect(article.slug).toBe('test-article');
      expect(article.body).toBe('Article body content');
    });

    it('get_nonexistent_article_throws_NotFoundError', async () => {
      await expect(
        articleService.getArticle('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createArticle', () => {
    it('create_article_generates_slug_from_title', async () => {
      const article = await articleService.createArticle(
        {
          title: 'How to Train Your Dragon',
          description: 'Ever wonder how?',
          body: 'You have to believe',
          tagList: ['dragons']
        },
        1
      );

      expect(article.slug).toBe('how-to-train-your-dragon');
      expect(article.title).toBe('How to Train Your Dragon');
      expect(article.tagList).toEqual(['dragons']);
    });

    it('create_article_with_duplicate_title_makes_slug_unique', async () => {
      mockArticleRepo.addArticle({ slug: 'test-title' });

      const article = await articleService.createArticle(
        { title: 'Test Title', description: 'Desc', body: 'Body' },
        1
      );

      expect(article.slug).toMatch(/^test-title-[a-z0-9]{6}$/);
    });
  });

  describe('updateArticle', () => {
    beforeEach(() => {
      mockArticleRepo.addArticle({
        slug: 'original-slug',
        title: 'Original Title',
        author: { username: 'author', bio: null, image: null, following: false }
      });
    });

    it('update_article_by_author_returns_updated_article', async () => {
      const updated = await articleService.updateArticle(
        'original-slug',
        { title: 'Updated Title' },
        1
      );

      expect(updated.title).toBe('Updated Title');
    });

    it('update_nonexistent_article_throws_NotFoundError', async () => {
      await expect(
        articleService.updateArticle('nonexistent', { title: 'New' }, 1)
      ).rejects.toThrow(NotFoundError);
    });

    it('update_article_by_non_author_throws_AuthorizationError', async () => {
      mockUserRepo.addUser({
        id: 2,
        email: 'other@example.com',
        username: 'other',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await expect(
        articleService.updateArticle('original-slug', { title: 'Hacked' }, 2)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('deleteArticle', () => {
    beforeEach(() => {
      mockArticleRepo.addArticle({
        slug: 'to-delete',
        author: { username: 'author', bio: null, image: null, following: false }
      });
    });

    it('delete_article_by_author_removes_article', async () => {
      await articleService.deleteArticle('to-delete', 1);

      const article = await mockArticleRepo.findBySlug('to-delete');
      expect(article).toBeNull();
    });

    it('delete_article_by_non_author_throws_AuthorizationError', async () => {
      mockUserRepo.addUser({
        id: 2,
        email: 'other@example.com',
        username: 'other',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await expect(
        articleService.deleteArticle('to-delete', 2)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('favoriteArticle', () => {
    beforeEach(() => {
      mockArticleRepo.addArticle({ slug: 'to-favorite' });
    });

    it('favorite_article_returns_article_with_favorited_true', async () => {
      const article = await articleService.favoriteArticle('to-favorite', 1);

      expect(article.favorited).toBe(true);
      expect(article.favoritesCount).toBe(1);
    });

    it('favorite_nonexistent_article_throws_NotFoundError', async () => {
      await expect(
        articleService.favoriteArticle('nonexistent', 1)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('unfavoriteArticle', () => {
    beforeEach(() => {
      const article = mockArticleRepo.addArticle({ slug: 'favorited' });
      article.favorited = true;
      article.favoritesCount = 1;
    });

    it('unfavorite_article_returns_article_with_favorited_false', async () => {
      const article = await articleService.unfavoriteArticle('favorited', 1);

      expect(article.favorited).toBe(false);
      expect(article.favoritesCount).toBe(0);
    });
  });
});
