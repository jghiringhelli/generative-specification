// tests/unit/ArticleService.test.ts
import { ArticleService } from '../../src/services/ArticleService';
import { IArticleRepository } from '../../src/repositories/IArticleRepository';
import { ValidationError, NotFoundError } from '../../src/errors/AppError';

describe('ArticleService Unit Tests', () => {
  let mockArticleRepository: jest.Mocked<IArticleRepository>;
  let articleService: ArticleService;

  beforeEach(() => {
    mockArticleRepository = {
      create: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findFeed: jest.fn(),
      favorite: jest.fn(),
      unfavorite: jest.fn()
    };
    articleService = new ArticleService(mockArticleRepository);
  });

  describe('createArticle', () => {
    it('should create an article with valid input', async () => {
      const mockCreated = {
        id: 'a1',
        slug: 'test-title-xyz',
        title: 'Test Title',
        description: 'Test description',
        body: 'Article content body',
        tagList: ['tech'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'author1',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.create.mockResolvedValue(mockCreated);

      const result = await articleService.createArticle('u1', {
        title: 'Test Title',
        description: 'Test description',
        body: 'Article content body',
        tagList: ['tech']
      });

      expect(result.slug).toBe('test-title-xyz');
      expect(result.body).toBe('Article content body');
      expect(mockArticleRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError if required fields are missing', async () => {
      await expect(
        articleService.createArticle('u1', {
          title: '',
          description: '',
          body: ''
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getArticle', () => {
    it('should return an article when found', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue({
        id: 'a1',
        slug: 'valid-slug',
        title: 'Valid Title',
        description: 'Desc',
        body: 'Body text',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'author1',
          bio: null,
          image: null,
          following: false
        }
      });

      const result = await articleService.getArticle('valid-slug', 'user1');
      expect(result.slug).toBe('valid-slug');
      expect(mockArticleRepository.findBySlug).toHaveBeenCalledWith('valid-slug', 'user1');
    });

    it('should throw NotFoundError when article is not found', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(articleService.getArticle('unknown-slug')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listArticles', () => {
    it('should call repository.findMany with filters', async () => {
      mockArticleRepository.findMany.mockResolvedValue({
        articles: [],
        articlesCount: 0
      });

      const filter = { tag: 'react', limit: 10, offset: 0 };
      const result = await articleService.listArticles(filter, 'user1');

      expect(result.articlesCount).toBe(0);
      expect(mockArticleRepository.findMany).toHaveBeenCalledWith(filter, 'user1');
    });
  });
});
