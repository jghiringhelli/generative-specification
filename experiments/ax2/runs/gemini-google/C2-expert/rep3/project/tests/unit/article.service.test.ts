import { ForbiddenError, NotFoundError } from '../../src/errors/app-error';
import { ArticleRepository, ArticleWithAuthorAndTags } from '../../src/repositories/article.repository';
import { UserRepository } from '../../src/repositories/user.repository';
import { ArticleService } from '../../src/services/article.service';

describe('ArticleService Unit Tests', () => {
  let mockArticleRepo: jest.Mocked<ArticleRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let articleService: ArticleService;

  const sampleArticle: ArticleWithAuthorAndTags = {
    id: 10,
    slug: 'sample-title-12345',
    title: 'Sample Title',
    description: 'Sample description',
    body: 'Sample body text that must be hidden in lists',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 1,
    author: {
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      password: 'hash',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tags: [{ id: 1, name: 'react' }],
    favorites: [],
  };

  beforeEach(() => {
    mockArticleRepo = {
      create: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      listArticles: jest.fn(),
      listFeed: jest.fn(),
      favorite: jest.fn(),
      unfavorite: jest.fn(),
    } as unknown as jest.Mocked<ArticleRepository>;

    mockUserRepo = {
      isFollowing: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<UserRepository>;

    articleService = new ArticleService(mockArticleRepo, mockUserRepo);
  });

  it('creates article and includes body in single article response', async () => {
    mockArticleRepo.create.mockResolvedValue(sampleArticle);

    const result = await articleService.createArticle(1, {
      title: 'Sample Title',
      description: 'Sample description',
      body: 'Sample body text that must be hidden in lists',
      tagList: ['react'],
    });

    expect(result.slug).toBe(sampleArticle.slug);
    expect(result.body).toBe('Sample body text that must be hidden in lists');
    expect(result.tagList).toEqual(['react']);
  });

  it('throws NotFoundError when article slug is not found', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue(null);

    await expect(articleService.getArticle('unknown-slug')).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when non-author attempts to update article', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue(sampleArticle);

    await expect(
      articleService.updateArticle('sample-title-12345', 99, {
        description: 'New description',
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when non-author attempts to delete article', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue(sampleArticle);

    await expect(
      articleService.deleteArticle('sample-title-12345', 99)
    ).rejects.toThrow(ForbiddenError);
  });

  it('omits body property from article list responses per spec', async () => {
    mockArticleRepo.listArticles.mockResolvedValue({
      articles: [sampleArticle],
      total: 1,
    });

    const result = await articleService.listArticles({ limit: 20, offset: 0 });

    expect(result.articlesCount).toBe(1);
    expect(result.articles[0].body).toBeUndefined();
    expect(result.articles[0].title).toBe('Sample Title');
  });

  it('omits body property from feed article responses per spec', async () => {
    mockArticleRepo.listFeed.mockResolvedValue({
      articles: [sampleArticle],
      total: 1,
    });

    const result = await articleService.listFeed(1, { limit: 20, offset: 0 });

    expect(result.articlesCount).toBe(1);
    expect(result.articles[0].body).toBeUndefined();
  });
});
