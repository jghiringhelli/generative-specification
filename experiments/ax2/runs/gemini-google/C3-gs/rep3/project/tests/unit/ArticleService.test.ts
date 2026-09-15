// tests/unit/ArticleService.test.ts
import { ArticleService } from '../../src/services/ArticleService';
import {
  IArticleRepository,
  ArticleRecord,
  CreateArticleData,
  UpdateArticleData,
  ListArticlesFilter
} from '../../src/repositories/IArticleRepository';
import { ValidationError, NotFoundError, ForbiddenError } from '../../src/errors/AppError';

class MockArticleRepository implements IArticleRepository {
  public articles: ArticleRecord[] = [];
  public favorites: Map<string, Set<string>> = new Map(); // userId -> set of articleIds

  public async create(data: CreateArticleData): Promise<ArticleRecord> {
    const article: ArticleRecord = {
      id: `article-${Date.now()}-${Math.random()}`,
      slug: data.slug,
      title: data.title,
      description: data.description,
      body: data.body,
      tagList: data.tagList,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: data.authorId,
      author: {
        id: data.authorId,
        username: 'author_user',
        bio: null,
        image: null
      },
      favoritesCount: 0,
      favorited: false
    };
    this.articles.push(article);
    return article;
  }

  public async findBySlug(slug: string, currentUserId?: string): Promise<ArticleRecord | null> {
    const article = this.articles.find(a => a.slug === slug);
    if (!article) return null;

    const favorited = currentUserId ? (this.favorites.get(currentUserId)?.has(article.id) ?? false) : false;
    return {
      ...article,
      favorited
    };
  }

  public async update(slug: string, data: UpdateArticleData, currentUserId?: string): Promise<ArticleRecord> {
    const index = this.articles.findIndex(a => a.slug === slug);
    if (index === -1) throw new NotFoundError('Article not found');

    const existing = this.articles[index];
    const updated: ArticleRecord = {
      ...existing,
      slug: data.slug ?? existing.slug,
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      body: data.body ?? existing.body,
      tagList: data.tagList ?? existing.tagList,
      updatedAt: new Date()
    };
    this.articles[index] = updated;

    const favorited = currentUserId ? (this.favorites.get(currentUserId)?.has(updated.id) ?? false) : false;
    return {
      ...updated,
      favorited
    };
  }

  public async delete(slug: string): Promise<void> {
    const index = this.articles.findIndex(a => a.slug === slug);
    if (index === -1) throw new NotFoundError('Article not found');
    this.articles.splice(index, 1);
  }

  public async list(filter: ListArticlesFilter): Promise<{ articles: ArticleRecord[]; count: number }> {
    let result = [...this.articles];
    if (filter.tag) {
      result = result.filter(a => a.tagList.includes(filter.tag!));
    }
    if (filter.author) {
      result = result.filter(a => a.author.username === filter.author);
    }
    const total = result.length;
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 20;
    const paginated = result.slice(offset, offset + limit);

    return {
      articles: paginated.map(a => ({
        ...a,
        favorited: filter.currentUserId ? (this.favorites.get(filter.currentUserId)?.has(a.id) ?? false) : false
      })),
      count: total
    };
  }

  public async listFeed(userId: string, limit = 20, offset = 0): Promise<{ articles: ArticleRecord[]; count: number }> {
    const paginated = this.articles.slice(offset, offset + limit);
    return {
      articles: paginated.map(a => ({
        ...a,
        favorited: this.favorites.get(userId)?.has(a.id) ?? false
      })),
      count: this.articles.length
    };
  }

  public async favorite(userId: string, slug: string): Promise<ArticleRecord> {
    const article = await this.findBySlug(slug);
    if (!article) throw new NotFoundError('Article not found');

    if (!this.favorites.has(userId)) {
      this.favorites.set(userId, new Set());
    }
    this.favorites.get(userId)!.add(article.id);
    article.favoritesCount += 1;
    article.favorited = true;
    return article;
  }

  public async unfavorite(userId: string, slug: string): Promise<ArticleRecord> {
    const article = await this.findBySlug(slug);
    if (!article) throw new NotFoundError('Article not found');

    if (this.favorites.has(userId)) {
      this.favorites.get(userId)!.delete(article.id);
    }
    article.favoritesCount = Math.max(0, article.favoritesCount - 1);
    article.favorited = false;
    return article;
  }

  public async isFavorited(userId: string, articleId: string): Promise<boolean> {
    return this.favorites.get(userId)?.has(articleId) ?? false;
  }
}

describe('ArticleService', () => {
  let articleRepository: MockArticleRepository;
  let articleService: ArticleService;

  beforeEach(() => {
    articleRepository = new MockArticleRepository();
    articleService = new ArticleService(articleRepository);
  });

  describe('createArticle', () => {
    it('creates an article with generated slug and valid fields', async () => {
      const article = await articleService.createArticle('author1', {
        title: 'Learn TypeScript Architecture',
        description: 'Comprehensive guide to clean code',
        body: 'Here is the full text of the article...',
        tagList: ['typescript', 'architecture']
      });

      expect(article.title).toBe('Learn TypeScript Architecture');
      expect(article.slug).toContain('learn-typescript-architecture');
      expect(article.body).toBe('Here is the full text of the article...');
      expect(article.tagList).toEqual(['typescript', 'architecture']);
      expect(article.favoritesCount).toBe(0);
      expect(article.favorited).toBe(false);
    });

    it('rejects article creation with blank title, description or body', async () => {
      await expect(
        articleService.createArticle('author1', {
          title: '',
          description: '',
          body: ''
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('listArticles and listFeed (performance spec: NO body field)', () => {
    beforeEach(async () => {
      await articleService.createArticle('author1', {
        title: 'Post One',
        description: 'Description 1',
        body: 'Secret Body 1',
        tagList: ['tech']
      });
      await articleService.createArticle('author1', {
        title: 'Post Two',
        description: 'Description 2',
        body: 'Secret Body 2',
        tagList: ['general']
      });
    });

    it('does NOT include body field in listArticles response', async () => {
      const result = await articleService.listArticles({});
      expect(result.articlesCount).toBe(2);
      expect(result.articles.length).toBe(2);
      expect((result.articles[0] as any).body).toBeUndefined();
      expect((result.articles[1] as any).body).toBeUndefined();
    });

    it('does NOT include body field in listFeed response', async () => {
      const result = await articleService.listFeed('follower1');
      expect(result.articlesCount).toBe(2);
      expect((result.articles[0] as any).body).toBeUndefined();
    });

    it('filters articles by tag', async () => {
      const result = await articleService.listArticles({ tag: 'tech' });
      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].title).toBe('Post One');
    });

    it('paginates articles with limit and offset', async () => {
      const result = await articleService.listArticles({ limit: 1, offset: 1 });
      expect(result.articles.length).toBe(1);
      expect(result.articlesCount).toBe(2);
      expect(result.articles[0].title).toBe('Post Two');
    });
  });

  describe('updateArticle and deleteArticle authorization', () => {
    let createdSlug: string;

    beforeEach(async () => {
      const created = await articleService.createArticle('author1', {
        title: 'Original Title',
        description: 'Original Desc',
        body: 'Original Body'
      });
      createdSlug = created.slug;
    });

    it('allows author to update article', async () => {
      const updated = await articleService.updateArticle('author1', createdSlug, {
        title: 'Updated Title'
      });
      expect(updated.title).toBe('Updated Title');
    });

    it('forbids non-author from updating article', async () => {
      await expect(
        articleService.updateArticle('another_user', createdSlug, {
          title: 'Hacked Title'
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('forbids non-author from deleting article', async () => {
      await expect(
        articleService.deleteArticle('another_user', createdSlug)
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows author to delete article', async () => {
      await articleService.deleteArticle('author1', createdSlug);
      await expect(articleService.getArticle(createdSlug)).rejects.toThrow(NotFoundError);
    });
  });

  describe('favorite and unfavorite', () => {
    let slug: string;

    beforeEach(async () => {
      const created = await articleService.createArticle('author1', {
        title: 'Favorite Me',
        description: 'Description',
        body: 'Body'
      });
      slug = created.slug;
    });

    it('favorites and unfavorites an article', async () => {
      const fav = await articleService.favoriteArticle('user1', slug);
      expect(fav.favorited).toBe(true);
      expect(fav.favoritesCount).toBe(1);

      const unfav = await articleService.unfavoriteArticle('user1', slug);
      expect(unfav.favorited).toBe(false);
      expect(unfav.favoritesCount).toBe(0);
    });
  });
});
