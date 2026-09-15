import { ArticleService } from '../../src/services/article.service';
import { IArticleRepository, ArticleWithRelations } from '../../src/repositories/article.repository';
import { ArticleMapper } from '../../src/services/article.mapper';
import { NotFoundError, ForbiddenError } from '../../src/utils/error.util';

describe('ArticleService (unit)', () => {
  let mockArticleRepository: jest.Mocked<IArticleRepository>;
  let mockMapper: jest.Mocked<ArticleMapper>;
  let articleService: ArticleService;

  const mockArticleRecord: ArticleWithRelations = {
    id: 1,
    slug: 'my-test-title-12345',
    title: 'My Test Title',
    description: 'Description',
    body: 'Detailed body',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 10,
    author: {
      id: 10,
      username: 'jake',
      bio: null,
      image: null
    },
    tags: [{ name: 'dragons' }],
    favorites: [],
    _count: {
      favorites: 0
    }
  };

  beforeEach(() => {
    mockArticleRepository = {
      create: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      listArticles: jest.fn(),
      feedArticles: jest.fn(),
      favoriteArticle: jest.fn(),
      unfavoriteArticle: jest.fn()
    };

    mockMapper = {
      toListItem: jest.fn(),
      toSingleData: jest.fn()
    } as unknown as jest.Mocked<ArticleMapper>;

    articleService = new ArticleService(mockArticleRepository, mockMapper);
  });

  describe('createArticle', () => {
    it('creates article and delegates mapping to single article response', async () => {
      mockArticleRepository.create.mockResolvedValue(mockArticleRecord);
      mockMapper.toSingleData.mockResolvedValue({
        slug: mockArticleRecord.slug,
        title: mockArticleRecord.title,
        description: mockArticleRecord.description,
        body: mockArticleRecord.body,
        tagList: ['dragons'],
        createdAt: mockArticleRecord.createdAt,
        updatedAt: mockArticleRecord.updatedAt,
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'jake',
          bio: null,
          image: null,
          following: false
        }
      });

      const result = await articleService.createArticle(10, {
        title: 'My Test Title',
        description: 'Description',
        body: 'Detailed body',
        tagList: ['dragons']
      });

      expect(result.article.title).toBe('My Test Title');
      expect(result.article.body).toBe('Detailed body');
    });
  });

  describe('updateArticle', () => {
    it('throws ForbiddenError when non-author attempts update', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticleRecord);

      await expect(
        articleService.updateArticle(mockArticleRecord.slug, 999, {
          title: 'New Title'
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError when updating non-existent slug', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(
        articleService.updateArticle('ghost-slug', 10, { title: 'New' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteArticle', () => {
    it('throws ForbiddenError when non-author attempts deletion', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticleRecord);

      await expect(
        articleService.deleteArticle(mockArticleRecord.slug, 999)
      ).rejects.toThrow(ForbiddenError);
    });

    it('deletes article when author requests deletion', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticleRecord);
      mockArticleRepository.delete.mockResolvedValue();

      await expect(
        articleService.deleteArticle(mockArticleRecord.slug, 10)
      ).resolves.not.toThrow();
      expect(mockArticleRepository.delete).toHaveBeenCalledWith(mockArticleRecord.id);
    });
  });

  describe('listArticles', () => {
    it('returns articlesCount along with mapped article list items', async () => {
      mockArticleRepository.listArticles.mockResolvedValue({
        articles: [mockArticleRecord],
        totalCount: 1
      });
      mockMapper.toListItem.mockResolvedValue({
        slug: mockArticleRecord.slug,
        title: mockArticleRecord.title,
        description: mockArticleRecord.description,
        tagList: ['dragons'],
        createdAt: mockArticleRecord.createdAt,
        updatedAt: mockArticleRecord.updatedAt,
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'jake',
          bio: null,
          image: null,
          following: false
        }
      });

      const result = await articleService.listArticles({});

      expect(result.articlesCount).toBe(1);
      expect(result.articles.length).toBe(1);
      expect((result.articles[0] as unknown as { body?: string }).body).toBeUndefined();
    });
  });
});
