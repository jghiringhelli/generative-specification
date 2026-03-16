
/**
 * Unit tests for ArticleService.
 */

import { ArticleService } from './article.service';
import type { IArticleRepository, IArticleWithMeta } from '../repositories/IArticleRepository';
import type { ITagRepository } from '../repositories/ITagRepository';
import { ForbiddenError } from '../errors/AppError';

const mockArticleRepository: jest.Mocked<IArticleRepository> = {
  findBySlug: jest.fn(),
  list: jest.fn(),
  getFeed: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  favorite: jest.fn(),
  unfavorite: jest.fn(),
  slugExists: jest.fn()
};

const mockTagRepository: jest.Mocked<ITagRepository> = {
  listAll: jest.fn(),
  upsertMany: jest.fn(),
  findByName: jest.fn()
};

describe('ArticleService', () => {
  let articleService: ArticleService;

  beforeEach(() => {
    jest.clearAllMocks();
    articleService = new ArticleService(mockArticleRepository, mockTagRepository);
  });

  describe('createArticle', () => {
    it('creates article with generated slug', async () => {
      const input = {
        title: 'How to Train Your Dragon',
        description: 'Ever wonder how?',
        body: 'You have to believe',
        tagList: ['dragons', 'training']
      };

      const createdArticle: IArticleWithMeta = {
        slug: 'how-to-train-your-dragon',
        title: input.title,
        description: input.description,
        body: input.body,
        tagList: input.tagList,
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.slugExists.mockResolvedValue(false);
      mockTagRepository.upsertMany.mockResolvedValue([]);
      mockArticleRepository.create.mockResolvedValue(createdArticle);

      const result = await articleService.createArticle(input, 1);

      expect(mockArticleRepository.slugExists).toHaveBeenCalled();
      expect(mockTagRepository.upsertMany).toHaveBeenCalledWith(input.tagList);
      expect(mockArticleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: input.title,
          description: input.description,
          body: input.body,
          tagList: input.tagList
        }),
        1
      );
      expect(result.slug).toBeDefined();
    });

    it('generates unique slug when base slug exists', async () => {
      const input = {
        title: 'Test Article',
        description: 'Description',
        body: 'Body',
        tagList: []
      };

      mockArticleRepository.slugExists.mockResolvedValue(true);
      mockArticleRepository.create.mockResolvedValue({
        slug: 'test-article-abc123',
        title: input.title,
        description: input.description,
        body: input.body,
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          following: false
        }
      });

      await articleService.createArticle(input, 1);

      expect(mockArticleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.stringContaining('test-article-')
        }),
        1
      );
    });
  });

  describe('updateArticle', () => {
    it('updates article and returns updated data', async () => {
      const updated: IArticleWithMeta = {
        slug: 'test-article',
        title: 'Updated Title',
        description: 'Updated description',
        body: 'Updated body',
        tagList: ['tag1'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.update.mockResolvedValue(updated);

      const result = await articleService.updateArticle(
        'test-article',
        { title: 'Updated Title' },
        1
      );

      expect(mockArticleRepository.update).toHaveBeenCalledWith(
        'test-article',
        { title: 'Updated Title' },
        1
      );
      expect(result.title).toBe('Updated Title');
    });

    it('throws ForbiddenError when user is not author', async () => {
      mockArticleRepository.update.mockRejectedValue(
        new ForbiddenError('Only the author can update this article')
      );

      await expect(
        articleService.updateArticle('test-article', { title: 'New' }, 2)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteArticle', () => {
    it('deletes article when user is author', async () => {
      mockArticleRepository.delete.mockResolvedValue(undefined);

      await articleService.deleteArticle('test-article', 1);

      expect(mockArticleRepository.delete).toHaveBeenCalledWith('test-article', 1);
    });

    it('throws ForbiddenError when user is not author', async () => {
      mockArticleRepository.delete.mockRejectedValue(
        new ForbiddenError('Only the author can delete this article')
      );

      await expect(articleService.deleteArticle('test-article', 2)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe('favoriteArticle', () => {
    it('favorites article and returns updated article', async () => {
      const favorited: IArticleWithMeta = {
        slug: 'test-article',
        title: 'Test',
        description: 'Desc',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: true,
        favoritesCount: 1,
        author: {
          username: 'author',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.favorite.mockResolvedValue(favorited);

      const result = await articleService.favoriteArticle('test-article', 1);

      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(1);
    });
  });

  describe('unfavoriteArticle', () => {
    it('unfavorites article and returns updated article', async () => {
      const unfavorited: IArticleWithMeta = {
        slug: 'test-article',
        title: 'Test',
        description: 'Desc',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'author',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.unfavorite.mockResolvedValue(unfavorited);

      const result = await articleService.unfavoriteArticle('test-article', 1);

      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
    });
  });
});
