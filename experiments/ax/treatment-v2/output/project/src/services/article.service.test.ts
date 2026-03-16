import { ArticleService } from './article.service';
import { ArticleRepository } from '../repositories/article.repository';
import { NotFoundError } from '../errors/NotFoundError';
import { AuthorizationError } from '../errors/AuthorizationError';

jest.mock('../repositories/article.repository');

describe('ArticleService', () => {
  let articleService: ArticleService;
  let mockArticleRepository: jest.Mocked<ArticleRepository>;

  const mockArticle = {
    id: 1,
    slug: 'how-to-train-your-dragon',
    title: 'How to train your dragon',
    description: 'Ever wonder how?',
    body: 'It takes a Jacobian',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    authorId: 1,
    author: {
      id: 1,
      username: 'jake',
      bio: 'I work at statefarm',
      image: 'https://example.com/jake.jpg',
      followedBy: [],
    },
    tags: [
      { tag: { name: 'dragons' } },
      { tag: { name: 'training' } },
    ],
    favoritedBy: [],
  };

  beforeEach(() => {
    mockArticleRepository = new ArticleRepository({} as any) as jest.Mocked<ArticleRepository>;
    articleService = new ArticleService(mockArticleRepository);
  });

  describe('listArticles', () => {
    it('listArticles_returns_articles_without_body_field', async () => {
      mockArticleRepository.findAll = jest.fn().mockResolvedValue({
        articles: [mockArticle],
        count: 1,
      });

      const result = await articleService.listArticles({});

      expect(result.articles[0]).not.toHaveProperty('body');
      expect(result.articles[0]).toHaveProperty('slug');
      expect(result.articles[0]).toHaveProperty('title');
      expect(result.articlesCount).toBe(1);
    });

    it('listArticles_applies_filters', async () => {
      mockArticleRepository.findAll = jest.fn().mockResolvedValue({
        articles: [],
        count: 0,
      });

      await articleService.listArticles({ tag: 'dragons', author: 'jake', limit: 10, offset: 0 });

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        { tag: 'dragons', author: 'jake', limit: 10, offset: 0 },
        undefined
      );
    });
  });

  describe('getFeed', () => {
    it('getFeed_returns_articles_from_followed_users', async () => {
      mockArticleRepository.findFeed = jest.fn().mockResolvedValue({
        articles: [mockArticle],
        count: 1,
      });

      const result = await articleService.getFeed(1, 20, 0);

      expect(result.articles).toHaveLength(1);
      expect(result.articlesCount).toBe(1);
      expect(mockArticleRepository.findFeed).toHaveBeenCalledWith(1, 20, 0, 1);
    });

    it('getFeed_returns_articles_without_body_field', async () => {
      mockArticleRepository.findFeed = jest.fn().mockResolvedValue({
        articles: [mockArticle],
        count: 1,
      });

      const result = await articleService.getFeed(1);

      expect(result.articles[0]).not.toHaveProperty('body');
    });
  });

  describe('getArticle', () => {
    it('getArticle_with_valid_slug_returns_article_with_body', async () => {
      mockArticleRepository.findBySlug = jest.fn().mockResolvedValue(mockArticle);

      const result = await articleService.getArticle('how-to-train-your-dragon');

      expect(result.article).toHaveProperty('body');
      expect(result.article.body).toBe('It takes a Jacobian');
    });

    it('getArticle_with_nonexistent_slug_throws_NotFoundError', async () => {
      mockArticleRepository.findBySlug = jest.fn().mockResolvedValue(null);

      await expect(articleService.getArticle('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createArticle', () => {
    it('createArticle_with_valid_data_returns_article', async () => {
      mockArticleRepository.create = jest.fn().mockResolvedValue(mockArticle);

      const result = await articleService.createArticle(
        {
          title: 'How to train your dragon',
          description: 'Ever wonder how?',
          body: 'It takes a Jacobian',
          tagList: ['dragons', 'training'],
        },
        1
      );

      expect(result.article.slug).toBe('how-to-train-your-dragon');
      expect(mockArticleRepository.create).toHaveBeenCalledWith({
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        tagList: ['dragons', 'training'],
        authorId: 1,
      });
    });
  });

  describe('updateArticle', () => {
    it('updateArticle_by_author_returns_updated_article', async () => {
      const updatedArticle = { ...mockArticle, title: 'Updated title' };
      mockArticleRepository.findBySlug = jest.fn().mockResolvedValue(mockArticle);
      mockArticleRepository.update = jest.fn().mockResolvedValue(updatedArticle);

      const result = await articleService.updateArticle(
        'how-to-train-your-dragon',
        { title: 'Updated title' },
        1
      );

      expect(result.article.title).toBe('Updated title');
    });

    it('updateArticle_by_non_author_throws_AuthorizationError', async () => {
      mockArticleRepository.findBySlug = jest.fn().mockResolvedValue(mockArticle);

      await expect(
        articleService.updateArticle('how-to-train-your-dragon', { title: 'New' }, 999)
      ).rejects.toThrow(AuthorizationError);
    });

    it('updateArticle_with_nonexistent_slug_throws_NotFoundError', async () => {
      mockArticleRepository.findBySlug = jest.fn().mockResolvedValue(null);

      await expect(
        articleService.updateArticle('nonexistent', { title: 'New' }, 1)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteArticle', () => {
    it('deleteArticle_by_author_succeeds', async () => {
      mockArticleRepository.findBySlug = jest.fn().mockResolvedValue(mockArticle);
      mockArticleRepository.delete = jest.fn().mockResolvedValue(undefined);

      await articleService.deleteArticle('how-to-train-your-dragon', 1);

      expect(mockArticleRepository.delete).toHaveBeenCalledWith('how-to-train-your-dragon');
    });

    it('deleteArticle_by_non_author_throws_AuthorizationError', async () => {
      mockArticleRepository.findBySlug = jest.fn().mockResolvedValue(mockArticle);

      await expect(articleService.deleteArticle('how-to-train-your-dragon', 999)).rejects.toThrow(
        AuthorizationError
      );
    });

    it('deleteArticle_with_nonexistent_slug_throws_NotFoundError', async () => {
      mockArticleRepository.findBySlug = jest.fn().mockResolvedValue(null);

      await expect(articleService.deleteArticle('nonexistent', 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('favoriteArticle', () => {
    it('favoriteArticle_returns_article_with_favorited_true', async () => {
      const favoritedArticle = {
        ...mockArticle,
        favoritedBy: [{ userId: 1 }],
      };
      mockArticleRepository.favorite = jest.fn().mockResolvedValue(favoritedArticle);

      const result = await articleService.favoriteArticle('how-to-train-your-dragon', 1);

      expect(result.article.favorited).toBe(true);
      expect(result.article.favoritesCount).toBe(1);
    });

    it('favoriteArticle_with_nonexistent_slug_throws_NotFoundError', async () => {
      mockArticleRepository.favorite = jest.fn().mockRejectedValue(new Error('Article not found'));

      await expect(articleService.favoriteArticle('nonexistent', 1)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('unfavoriteArticle', () => {
    it('unfavoriteArticle_returns_article_with_favorited_false', async () => {
      mockArticleRepository.unfavorite = jest.fn().mockResolvedValue(mockArticle);

      const result = await articleService.unfavoriteArticle('how-to-train-your-dragon', 1);

      expect(result.article.favorited).toBe(false);
      expect(result.article.favoritesCount).toBe(0);
    });

    it('unfavoriteArticle_with_nonexistent_slug_throws_NotFoundError', async () => {
      mockArticleRepository.unfavorite = jest
        .fn()
        .mockRejectedValue(new Error('Article not found'));

      await expect(articleService.unfavoriteArticle('nonexistent', 1)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
