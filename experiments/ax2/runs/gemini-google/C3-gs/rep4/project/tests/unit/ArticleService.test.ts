import { ArticleService } from '../../src/services/ArticleService';
import { IArticleRepository, CreateArticleData, UpdateArticleData } from '../../src/repositories/IArticleRepository';
import { IProfileRepository, ProfileData } from '../../src/repositories/IProfileRepository';
import { ArticleEntity, ArticleQueryFilters, UserEntity } from '../../src/types';
import { ForbiddenError, NotFoundError, ValidationError } from '../../src/errors/AppError';

class FakeArticleRepository implements IArticleRepository {
  private articles: ArticleEntity[] = [];

  async findBySlug(slug: string, currentUserId?: string): Promise<ArticleEntity | null> {
    const art = this.articles.find((a) => a.slug === slug);
    if (!art) return null;
    return { ...art };
  }

  async findMany(filters: ArticleQueryFilters): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    let list = [...this.articles];
    if (filters.tag) {
      list = list.filter((a) => a.tags?.includes(filters.tag!));
    }
    if (filters.author) {
      list = list.filter((a) => a.author?.username === filters.author);
    }
    return { articles: list, articlesCount: list.length };
  }

  async findFeed(userId: string): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    return { articles: this.articles, articlesCount: this.articles.length };
  }

  async create(authorId: string, data: CreateArticleData): Promise<ArticleEntity> {
    const entity: ArticleEntity = {
      id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      slug: data.title.toLowerCase().replace(/\s+/g, '-'),
      title: data.title,
      description: data.description,
      body: data.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId,
      author: {
        id: authorId,
        username: 'author_user',
        email: 'author@example.com',
        passwordHash: 'hash',
        bio: '',
        image: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      tags: data.tagList ?? [],
      favoritesCount: 0,
      favorited: false
    };
    this.articles.push(entity);
    return entity;
  }

  async update(slug: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const art = this.articles.find((a) => a.slug === slug);
    if (!art) throw new NotFoundError('Not found');
    if (data.title) art.title = data.title;
    if (data.description) art.description = data.description;
    if (data.body) art.body = data.body;
    art.updatedAt = new Date();
    return art;
  }

  async delete(slug: string): Promise<void> {
    this.articles = this.articles.filter((a) => a.slug !== slug);
  }

  async favorite(articleId: string, _userId: string): Promise<ArticleEntity> {
    const art = this.articles.find((a) => a.id === articleId);
    if (!art) throw new NotFoundError('Not found');
    art.favorited = true;
    art.favoritesCount = (art.favoritesCount ?? 0) + 1;
    return art;
  }

  async unfavorite(articleId: string, _userId: string): Promise<ArticleEntity> {
    const art = this.articles.find((a) => a.id === articleId);
    if (!art) throw new NotFoundError('Not found');
    art.favorited = false;
    art.favoritesCount = Math.max(0, (art.favoritesCount ?? 1) - 1);
    return art;
  }
}

class FakeProfileRepository implements IProfileRepository {
  async findProfile(): Promise<ProfileData | null> {
    return null;
  }
  async follow(): Promise<ProfileData> {
    throw new Error('Not implemented');
  }
  async unfollow(): Promise<ProfileData> {
    throw new Error('Not implemented');
  }
  async isFollowing(): Promise<boolean> {
    return false;
  }
}

describe('ArticleService Unit Tests', () => {
  let articleRepo: FakeArticleRepository;
  let profileRepo: FakeProfileRepository;
  let articleService: ArticleService;

  beforeEach(() => {
    articleRepo = new FakeArticleRepository();
    profileRepo = new FakeProfileRepository();
    articleService = new ArticleService(articleRepo, profileRepo);
  });

  it('creates an article with body present', async () => {
    const created = await articleService.createArticle('author-123', {
      title: 'How to Train Your Dragon',
      description: 'Ever wonder how?',
      body: 'It takes a lot of patience.',
      tagList: ['dragons', 'training']
    });

    expect(created.title).toBe('How to Train Your Dragon');
    expect(created.slug).toBe('how-to-train-your-dragon');
    expect(created.body).toBe('It takes a lot of patience.');
    expect(created.tagList).toEqual(['dragons', 'training']);
  });

  it('rejects creation when required fields are missing', async () => {
    await expect(
      articleService.createArticle('author-123', {
        title: '',
        description: '',
        body: ''
      })
    ).rejects.toThrow(ValidationError);
  });

  it('listArticles does NOT include the body field in results', async () => {
    await articleService.createArticle('author-123', {
      title: 'Performance Optimization',
      description: 'Spec change 2024-08-16',
      body: 'Sensitive large body content',
      tagList: ['perf']
    });

    const result = await articleService.listArticles({});
    expect(result.articlesCount).toBe(1);
    expect(result.articles[0].title).toBe('Performance Optimization');
    expect(result.articles[0].body).toBeUndefined();
  });

  it('getArticle includes the body field', async () => {
    await articleService.createArticle('author-123', {
      title: 'Full Article View',
      description: 'Summary',
      body: 'Detailed body text',
      tagList: []
    });

    const article = await articleService.getArticle('full-article-view');
    expect(article.body).toBe('Detailed body text');
  });

  it('allows author to update an article', async () => {
    await articleService.createArticle('author-123', {
      title: 'Original Title',
      description: 'Original Description',
      body: 'Original Body'
    });

    const updated = await articleService.updateArticle('author-123', 'original-title', {
      description: 'Updated Description'
    });
    expect(updated.description).toBe('Updated Description');
  });

  it('forbids non-author from updating article', async () => {
    await articleService.createArticle('author-123', {
      title: 'Guarded Article',
      description: 'Description',
      body: 'Body'
    });

    await expect(
      articleService.updateArticle('other-user', 'guarded-article', {
        description: 'Malicious update'
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('forbids non-author from deleting article', async () => {
    await articleService.createArticle('author-123', {
      title: 'Protected Article',
      description: 'Description',
      body: 'Body'
    });

    await expect(
      articleService.deleteArticle('other-user', 'protected-article')
    ).rejects.toThrow(ForbiddenError);
  });

  it('favorites and unfavorites an article correctly', async () => {
    await articleService.createArticle('author-123', {
      title: 'Favorite Test',
      description: 'Description',
      body: 'Body'
    });

    const favorited = await articleService.favoriteArticle('user-456', 'favorite-test');
    expect(favorited.favorited).toBe(true);
    expect(favorited.favoritesCount).toBe(1);

    const unfavorited = await articleService.unfavoriteArticle('user-456', 'favorite-test');
    expect(unfavorited.favorited).toBe(false);
    expect(unfavorited.favoritesCount).toBe(0);
  });
});
