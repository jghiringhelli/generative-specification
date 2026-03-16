import { ArticleService } from './article.service';
import { IArticleRepository, ArticleWithRelations } from '../repositories/article.repository';
import { ITagRepository } from '../repositories/tag.repository';
import { IProfileRepository } from '../repositories/profile.repository';
import { NotFoundError, AuthorizationError } from '../errors';

describe('ArticleService', () => {
  let articleService: ArticleService;
  let mockArticleRepository: jest.Mocked<IArticleRepository>;
  let mockTagRepository: jest.Mocked<ITagRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;

  const mockArticle: ArticleWithRelations = {
    id: 1,
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    authorId: 1,
    author: {
      id: 1,
      username: 'testuser',
      bio: null,
      image: null
    },
    tags: [
      {
        tag: {
          name: 'testing'
        }
      }
    ],
    favoritedBy: [],
    _count: {
      favoritedBy: 0
    }
  };

  beforeEach(() => {
    mockArticleRepository = {
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      findFeed: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      slugExists: jest.fn(),
      favorite: jest.fn(),
      unfavorite: jest.fn()
    };

    mockTagRepository = {
      findByName: jest.fn(),
      findAll: jest.fn(),
      upsertMany: jest.fn()
    };

    mockProfileRepository = {
      isFollowing: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
      getFollowerCount: jest.fn(),
      getFollowingCount: jest.fn()
    };

    articleService = new ArticleService(
      mockArticleRepository,
      mockTagRepository,
      mockProfileRepository
    );
  });

  describe('createArticle', () => {
    it('create_article_with_valid_data_generates_slug_and_returns_article', async () => {
      mockArticleRepository.slugExists.mockResolvedValue(false);
      mockTagRepository.upsertMany.mockResolvedValue([{ id: 1, name: 'testing' }]);
      mockArticleRepository.create.mockResolvedValue(mockArticle);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.createArticle(
        {
          title: 'Test Article',
          description: 'Test description',
          body: 'Test body',
          tagList: ['testing']
        },
        1
      );

      expect(result.slug).toBe('test-article');
      expect(result.title).toBe('Test Article');
      expect(result.tagList).toEqual(['testing']);
    });

    it('create_article_with_empty_tagList_does_not_call_upsertMany', async () => {
      const articleNoTags = { ...mockArticle, tags: [] };
      mockArticleRepository.slugExists.mockResolvedValue(false);
      mockArticleRepository.create.mockResolvedValue(articleNoTags);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.createArticle(
        { title: 'Test Article', description: 'Test', body: 'Test', tagList: [] },
        1
      );

      expect(mockTagRepository.upsertMany).not.toHaveBeenCalled();
      expect(result.tagList).toEqual([]);
    });

    it('create_article_without_tagList_does_not_call_upsertMany', async () => {
      const articleNoTags = { ...mockArticle, tags: [] };
      mockArticleRepository.slugExists.mockResolvedValue(false);
      mockArticleRepository.create.mockResolvedValue(articleNoTags);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.createArticle(
        { title: 'Test Article', description: 'Test', body: 'Test' },
        1
      );

      expect(mockTagRepository.upsertMany).not.toHaveBeenCalled();
    });

    it('create_article_with_duplicate_slug_appends_counter', async () => {
      mockArticleRepository.slugExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockTagRepository.upsertMany.mockResolvedValue([]);
      mockArticleRepository.create.mockResolvedValue({
        ...mockArticle,
        slug: 'test-article-2'
      });
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.createArticle(
        {
          title: 'Test Article',
          description: 'Test',
          body: 'Test'
        },
        1
      );

      expect(mockArticleRepository.slugExists).toHaveBeenCalledWith('test-article');
      expect(mockArticleRepository.slugExists).toHaveBeenCalledWith('test-article-2');
    });

    it('create_article_with_two_duplicate_slugs_increments_counter_to_three', async () => {
      mockArticleRepository.slugExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockTagRepository.upsertMany.mockResolvedValue([]);
      mockArticleRepository.create.mockResolvedValue({
        ...mockArticle,
        slug: 'test-article-3'
      });
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.createArticle(
        { title: 'Test Article', description: 'Test', body: 'Test' },
        1
      );

      expect(mockArticleRepository.slugExists).toHaveBeenCalledWith('test-article-3');
    });

    it('create_article_strips_leading_trailing_whitespace_from_slug', async () => {
      mockArticleRepository.slugExists.mockResolvedValue(false);
      mockTagRepository.upsertMany.mockResolvedValue([]);
      mockArticleRepository.create.mockResolvedValue({ ...mockArticle, slug: 'hello-world' });
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.createArticle(
        { title: '  hello world  ', description: 'Test', body: 'Test' },
        1
      );

      expect(mockArticleRepository.slugExists).toHaveBeenCalledWith('hello-world');
    });

    it('create_article_collapses_consecutive_hyphens_in_slug', async () => {
      mockArticleRepository.slugExists.mockResolvedValue(false);
      mockTagRepository.upsertMany.mockResolvedValue([]);
      mockArticleRepository.create.mockResolvedValue({ ...mockArticle, slug: 'test-article' });
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.createArticle(
        { title: 'test--article', description: 'Test', body: 'Test' },
        1
      );

      expect(mockArticleRepository.slugExists).toHaveBeenCalledWith('test-article');
    });
  });

  describe('getArticle', () => {
    it('get_existing_article_returns_article_with_author', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.getArticle('test-article');

      expect(result.slug).toBe('test-article');
      expect(result.author.username).toBe('testuser');
      expect(result.favorited).toBe(false);
      expect(result.author.following).toBe(false);
    });

    it('get_nonexistent_article_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(articleService.getArticle('nonexistent')).rejects.toThrow(
        'Article'
      );
    });
  });

  describe('updateArticle', () => {
    it('update_article_by_author_succeeds', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockArticleRepository.update.mockResolvedValue({
        ...mockArticle,
        title: 'Updated Title'
      });
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.updateArticle(
        'test-article',
        { title: 'Updated Title' },
        1
      );

      expect(result.title).toBe('Updated Title');
    });

    it('update_nonexistent_article_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(
        articleService.updateArticle('nonexistent', { title: 'New' }, 1)
      ).rejects.toThrow('Article');
    });

    it('update_article_by_non_author_throws_authorization_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);

      await expect(
        articleService.updateArticle('test-article', { title: 'Updated' }, 999)
      ).rejects.toThrow('Only the author can update');
    });

    it('update_article_title_generates_new_slug', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockArticleRepository.slugExists.mockResolvedValue(false);
      mockArticleRepository.update.mockResolvedValue({
        ...mockArticle,
        slug: 'new-title',
        title: 'New Title'
      });
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.updateArticle(
        'test-article',
        { title: 'New Title' },
        1
      );

      expect(mockArticleRepository.update).toHaveBeenCalledWith(
        'test-article',
        expect.objectContaining({ newSlug: 'new-title' })
      );
    });

    it('update_article_with_same_title_does_not_regenerate_slug', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockArticleRepository.update.mockResolvedValue(mockArticle);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.updateArticle(
        'test-article',
        { title: mockArticle.title },
        1
      );

      expect(mockArticleRepository.slugExists).not.toHaveBeenCalled();
      expect(mockArticleRepository.update).toHaveBeenCalledWith(
        'test-article',
        expect.objectContaining({ newSlug: undefined })
      );
    });
  });

  describe('deleteArticle', () => {
    it('delete_article_by_author_succeeds', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockArticleRepository.delete.mockResolvedValue();

      await articleService.deleteArticle('test-article', 1);

      expect(mockArticleRepository.delete).toHaveBeenCalledWith('test-article');
    });

    it('delete_nonexistent_article_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(
        articleService.deleteArticle('nonexistent', 1)
      ).rejects.toThrow('Article');
    });

    it('delete_article_by_non_author_throws_authorization_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);

      await expect(
        articleService.deleteArticle('test-article', 999)
      ).rejects.toThrow('Only the author can delete');
    });
  });

  describe('favoriteArticle', () => {
    it('favorite_article_updates_favorited_status', async () => {
      mockArticleRepository.findBySlug
        .mockResolvedValueOnce(mockArticle)
        .mockResolvedValueOnce({
          ...mockArticle,
          favoritedBy: [{ userId: 1 }],
          _count: { favoritedBy: 1 }
        });
      mockArticleRepository.favorite.mockResolvedValue();
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.favoriteArticle('test-article', 1);

      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(1);
    });

    it('favorite_nonexistent_article_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(
        articleService.favoriteArticle('nonexistent', 1)
      ).rejects.toThrow('Article');
    });
  });

  describe('unfavoriteArticle', () => {
    it('unfavorite_article_updates_favorited_status', async () => {
      mockArticleRepository.findBySlug
        .mockResolvedValueOnce(mockArticle)
        .mockResolvedValueOnce(mockArticle);
      mockArticleRepository.unfavorite.mockResolvedValue();
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.unfavoriteArticle('test-article', 1);

      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
    });

    it('unfavorite_nonexistent_article_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(
        articleService.unfavoriteArticle('nonexistent', 1)
      ).rejects.toThrow('Article');
    });
  });

  describe('listArticles', () => {
    it('list_articles_returns_articles_with_count', async () => {
      mockArticleRepository.findAll.mockResolvedValue([mockArticle]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.listArticles({});

      expect(result.articles).toHaveLength(1);
      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].slug).toBe('test-article');
      expect(result.articles[0].favorited).toBe(false);
    });

    it('list_articles_passes_filters_to_repository', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.listArticles({ tag: 'javascript', author: 'testuser' });

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ tag: 'javascript', author: 'testuser' })
      );
    });

    it('list_articles_applies_default_limit_when_not_provided', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.listArticles({});

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, offset: 0 })
      );
    });

    it('list_articles_clamps_limit_above_max_to_max_limit', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.listArticles({ limit: 999 });

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 })
      );
    });

    it('list_articles_clamps_limit_below_one_to_default', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.listArticles({ limit: 0 });

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 })
      );
    });

    it('list_articles_with_limit_one_uses_exactly_one', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.listArticles({ limit: 1 });

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 1 })
      );
    });

    it('list_articles_with_limit_at_max_uses_max_limit', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.listArticles({ limit: 100 });

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 })
      );
    });

    it('list_articles_clamps_negative_offset_to_default', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.listArticles({ offset: -1 });

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0 })
      );
    });

    it('list_articles_with_offset_zero_uses_zero', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.listArticles({ offset: 0 });

      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0 })
      );
    });

    it('list_articles_shows_favorited_true_when_user_has_favorited', async () => {
      const favoritedArticle = {
        ...mockArticle,
        favoritedBy: [{ userId: 42 }],
        _count: { favoritedBy: 1 }
      };
      mockArticleRepository.findAll.mockResolvedValue([favoritedArticle]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.listArticles({}, 42);

      expect(result.articles[0].favorited).toBe(true);
      expect(result.articles[0].favoritesCount).toBe(1);
    });

    it('list_articles_shows_favorited_false_when_user_has_not_favorited', async () => {
      const favoritedByOther = {
        ...mockArticle,
        favoritedBy: [{ userId: 99 }],
        _count: { favoritedBy: 1 }
      };
      mockArticleRepository.findAll.mockResolvedValue([favoritedByOther]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await articleService.listArticles({}, 42);

      expect(result.articles[0].favorited).toBe(false);
    });
  });

  describe('getFeed', () => {
    it('get_feed_returns_articles_from_followed_users', async () => {
      mockArticleRepository.findFeed.mockResolvedValue([mockArticle]);
      mockProfileRepository.isFollowing.mockResolvedValue(true);

      const result = await articleService.getFeed(1);

      expect(result.articles).toHaveLength(1);
      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].author.following).toBe(true);
    });

    it('get_feed_passes_validated_limit_and_offset_to_repository', async () => {
      mockArticleRepository.findFeed.mockResolvedValue([]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      await articleService.getFeed(1, 5, 10);

      expect(mockArticleRepository.findFeed).toHaveBeenCalledWith(1, 5, 10);
    });
  });
});
