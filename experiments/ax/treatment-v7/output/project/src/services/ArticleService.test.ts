import { ArticleService } from './ArticleService';
import { InMemoryArticleRepository } from '../repositories/InMemoryArticleRepository';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type { Article } from '../types/domain';

/** Build a minimal Article fixture for seeding the in-memory repository. */
function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 1,
    slug: 'test-slug',
    title: 'Test Title',
    description: 'Test description',
    body: 'Test body',
    authorId: 10,
    author: { username: 'author', bio: null, image: null, following: false },
    tagList: ['test'],
    favoritesCount: 0,
    favorited: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('ArticleService', () => {
  let repo: InMemoryArticleRepository;
  let service: ArticleService;

  beforeEach(() => {
    repo = new InMemoryArticleRepository();
    service = new ArticleService(repo);
  });

  // ===========================================================================
  // getArticle
  // ===========================================================================
  describe('getArticle', () => {
    it('returns the article when it exists', async () => {
      repo.seed([makeArticle()]);
      const article = await service.getArticle('test-slug');
      expect(article.slug).toBe('test-slug');
    });

    it('throws NotFoundError when article does not exist', async () => {
      await expect(service.getArticle('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('returns article with favorited=true for user who has favorited', async () => {
      repo.seed([makeArticle()]);
      await repo.addFavorite(99, 'test-slug');
      const article = await service.getArticle('test-slug', 99);
      expect(article.favorited).toBe(true);
    });
  });

  // ===========================================================================
  // listArticles
  // ===========================================================================
  describe('listArticles', () => {
    it('returns all articles with default pagination', async () => {
      repo.seed([makeArticle({ id: 1, slug: 'a' }), makeArticle({ id: 2, slug: 'b' })]);
      const result = await service.listArticles({}, {});
      expect(result.articlesCount).toBe(2);
      expect(result.articles).toHaveLength(2);
    });

    it('respects limit and offset', async () => {
      repo.seed([
        makeArticle({ id: 1, slug: 'a', createdAt: new Date('2024-01-03') }),
        makeArticle({ id: 2, slug: 'b', createdAt: new Date('2024-01-02') }),
        makeArticle({ id: 3, slug: 'c', createdAt: new Date('2024-01-01') }),
      ]);
      const result = await service.listArticles({}, { limit: 1, offset: 1 });
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].slug).toBe('b');
    });

    it('filters by tag', async () => {
      repo.seed([
        makeArticle({ id: 1, slug: 'a', tagList: ['dragons'] }),
        makeArticle({ id: 2, slug: 'b', tagList: ['fish'] }),
      ]);
      const result = await service.listArticles({ tag: 'dragons' }, {});
      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].tagList).toContain('dragons');
    });

    it('filters by author username', async () => {
      repo.seed([
        makeArticle({
          id: 1,
          slug: 'a',
          author: { username: 'alice', bio: null, image: null, following: false },
        }),
        makeArticle({
          id: 2,
          slug: 'b',
          author: { username: 'bob', bio: null, image: null, following: false },
        }),
      ]);
      const result = await service.listArticles({ author: 'alice' }, {});
      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].author.username).toBe('alice');
    });
  });

  // ===========================================================================
  // createArticle
  // ===========================================================================
  describe('createArticle', () => {
    it('creates article with given data and returns it', async () => {
      const article = await service.createArticle(1, {
        title: 'New Article',
        description: 'Desc',
        body: 'Body',
        tagList: ['tag1'],
      });
      expect(article.title).toBe('New Article');
      expect(article.tagList).toEqual(['tag1']);
      expect(article.favorited).toBe(false);
      expect(article.favoritesCount).toBe(0);
    });
  });

  // ===========================================================================
  // updateArticle
  // ===========================================================================
  describe('updateArticle', () => {
    it('throws NotFoundError when article does not exist', async () => {
      await expect(service.updateArticle('nonexistent', 10, { title: 'x' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws ForbiddenError when user is not the author', async () => {
      repo.seed([makeArticle({ authorId: 10 })]);
      await expect(service.updateArticle('test-slug', 99, { title: 'x' })).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('updates article successfully when user is the author', async () => {
      repo.seed([makeArticle({ authorId: 10 })]);
      const updated = await service.updateArticle('test-slug', 10, { title: 'Updated' });
      expect(updated.title).toBe('Updated');
    });

    it('returns 404 before 403 — checks existence before authorization', async () => {
      // Nonexistent slug must throw NotFoundError, not ForbiddenError, regardless of userId
      await expect(service.updateArticle('ghost', 10, { title: 'x' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  // ===========================================================================
  // deleteArticle
  // ===========================================================================
  describe('deleteArticle', () => {
    it('throws NotFoundError when article does not exist', async () => {
      await expect(service.deleteArticle('nonexistent', 10)).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user is not the author', async () => {
      repo.seed([makeArticle({ authorId: 10 })]);
      await expect(service.deleteArticle('test-slug', 99)).rejects.toThrow(ForbiddenError);
    });

    it('deletes article successfully when user is the author', async () => {
      repo.seed([makeArticle({ authorId: 10 })]);
      await service.deleteArticle('test-slug', 10);
      await expect(service.getArticle('test-slug')).rejects.toThrow(NotFoundError);
    });
  });

  // ===========================================================================
  // favoriteArticle
  // ===========================================================================
  describe('favoriteArticle', () => {
    it('returns article with favorited: true', async () => {
      repo.seed([makeArticle()]);
      const article = await service.favoriteArticle(99, 'test-slug');
      expect(article.favorited).toBe(true);
      expect(article.favoritesCount).toBe(1);
    });

    it('throws NotFoundError when article does not exist', async () => {
      await expect(service.favoriteArticle(1, 'ghost')).rejects.toThrow(NotFoundError);
    });
  });

  // ===========================================================================
  // unfavoriteArticle
  // ===========================================================================
  describe('unfavoriteArticle', () => {
    it('returns article with favorited: false after unfavorite', async () => {
      repo.seed([makeArticle()]);
      await service.favoriteArticle(99, 'test-slug');
      const article = await service.unfavoriteArticle(99, 'test-slug');
      expect(article.favorited).toBe(false);
      expect(article.favoritesCount).toBe(0);
    });

    it('throws NotFoundError when article does not exist', async () => {
      await expect(service.unfavoriteArticle(1, 'ghost')).rejects.toThrow(NotFoundError);
    });
  });

  // ===========================================================================
  // getFeed
  // ===========================================================================
  describe('getFeed', () => {
    it('returns articles with default pagination', async () => {
      repo.seed([makeArticle()]);
      const result = await service.getFeed(1, {});
      expect(result.articlesCount).toBe(1);
    });
  });
});
