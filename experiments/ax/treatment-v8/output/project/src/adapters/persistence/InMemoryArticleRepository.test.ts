/**
 * Unit tests for {@link InMemoryArticleRepository}.
 *
 * The fake is a working implementation of the article persistence port, so it
 * is tested as a unit: recency ordering, filtering by tag/author/favoriter,
 * pagination with a pre-pagination total, the derived favorites count, the
 * idempotent favorite edge, and soft-delete exclusion from every read.
 *
 * @gs-links: docs/specs/articles.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { NotFoundError } from '../../errors/AppError.js';
import type { Article, NewArticle } from '../../repositories/IArticleRepository.js';
import { InMemoryArticleRepository } from './InMemoryArticleRepository.js';

const base: Omit<NewArticle, 'slug' | 'title'> = {
  description: 'desc',
  body: 'body',
  tagList: [],
  authorId: 'author-1',
};

function newArticle(overrides: Partial<NewArticle>): NewArticle {
  return { slug: 'slug', title: 'Title', ...base, ...overrides };
}

describe('InMemoryArticleRepository', () => {
  let repo: InMemoryArticleRepository;

  beforeEach(() => {
    repo = new InMemoryArticleRepository();
  });

  describe('create + findBySlug', () => {
    it('persists an article and finds it by slug with a zero favorites count', async () => {
      const created = await repo.create(newArticle({ slug: 'a', title: 'A' }));
      expect(created.favoritesCount).toBe(0);
      const found = await repo.findBySlug('a');
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('A');
    });

    it('returns null for an unknown slug', async () => {
      expect(await repo.findBySlug('missing')).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await repo.create(newArticle({ slug: 'a', title: 'A', authorId: 'jane', tagList: ['x'] }));
      await repo.create(newArticle({ slug: 'b', title: 'B', authorId: 'bob', tagList: ['y'] }));
      await repo.create(newArticle({ slug: 'c', title: 'C', authorId: 'jane', tagList: ['x', 'z'] }));
    });

    it('returns articles newest first with the total count', async () => {
      const page = await repo.list({ limit: 20, offset: 0 });
      expect(page.total).toBe(3);
      expect(page.articles.map((a) => a.slug)).toEqual(['c', 'b', 'a']);
    });

    it('filters by tag', async () => {
      const page = await repo.list({ tag: 'x', limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.slug)).toEqual(['c', 'a']);
      expect(page.total).toBe(2);
    });

    it('filters by author id', async () => {
      const page = await repo.list({ authorId: 'bob', limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.slug)).toEqual(['b']);
    });

    it('filters by favoriter id', async () => {
      const a = await repo.findBySlug('a');
      await repo.addFavorite(a!.id, 'reader');
      const page = await repo.list({ favoritedByUserId: 'reader', limit: 20, offset: 0 });
      expect(page.articles.map((s) => s.slug)).toEqual(['a']);
    });

    it('paginates with offset/limit while reporting the full total', async () => {
      const page = await repo.list({ limit: 1, offset: 1 });
      expect(page.total).toBe(3);
      expect(page.articles.map((a) => a.slug)).toEqual(['b']);
    });
  });

  describe('feed', () => {
    beforeEach(async () => {
      await repo.create(newArticle({ slug: 'a', title: 'A', authorId: 'jane' }));
      await repo.create(newArticle({ slug: 'b', title: 'B', authorId: 'bob' }));
      await repo.create(newArticle({ slug: 'c', title: 'C', authorId: 'carol' }));
    });

    it('returns only articles by the given authors, newest first', async () => {
      const page = await repo.feed({ authorIds: ['jane', 'carol'], limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.slug)).toEqual(['c', 'a']);
      expect(page.total).toBe(2);
    });

    it('returns an empty page when no authors are followed', async () => {
      const page = await repo.feed({ authorIds: [], limit: 20, offset: 0 });
      expect(page.articles).toEqual([]);
      expect(page.total).toBe(0);
    });
  });

  describe('favorites', () => {
    let article: Article;
    beforeEach(async () => {
      article = await repo.create(newArticle({ slug: 'a', title: 'A' }));
    });

    it('increments the derived count and reports isFavorited', async () => {
      const updated = await repo.addFavorite(article.id, 'reader');
      expect(updated.favoritesCount).toBe(1);
      expect(await repo.isFavorited(article.id, 'reader')).toBe(true);
    });

    it('is idempotent — favoriting twice keeps a count of one', async () => {
      await repo.addFavorite(article.id, 'reader');
      const updated = await repo.addFavorite(article.id, 'reader');
      expect(updated.favoritesCount).toBe(1);
    });

    it('decrements on unfavorite and is a no-op when not favorited', async () => {
      await repo.addFavorite(article.id, 'reader');
      const after = await repo.removeFavorite(article.id, 'reader');
      expect(after.favoritesCount).toBe(0);
      const again = await repo.removeFavorite(article.id, 'reader');
      expect(again.favoritesCount).toBe(0);
    });

    it('rejects favoriting an unknown article', async () => {
      await expect(repo.addFavorite('missing', 'reader')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('update', () => {
    it('applies partial changes and bumps updatedAt', async () => {
      const created = await repo.create(newArticle({ slug: 'a', title: 'A' }));
      const updated = await repo.update('a', { title: 'A2', slug: 'a2', body: 'new' });
      expect(updated.title).toBe('A2');
      expect(updated.slug).toBe('a2');
      expect(updated.body).toBe('new');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it('rejects updating an unknown slug', async () => {
      await expect(repo.update('missing', { title: 'x' })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('delete (soft)', () => {
    beforeEach(async () => {
      await repo.create(newArticle({ slug: 'a', title: 'A', authorId: 'jane' }));
    });

    it('excludes a soft-deleted article from findBySlug and list', async () => {
      await repo.delete('a');
      expect(await repo.findBySlug('a')).toBeNull();
      const page = await repo.list({ limit: 20, offset: 0 });
      expect(page.total).toBe(0);
    });

    it('rejects deleting an unknown or already-deleted slug', async () => {
      await repo.delete('a');
      await expect(repo.delete('a')).rejects.toBeInstanceOf(NotFoundError);
      await expect(repo.delete('missing')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('listTags', () => {
    it('returns an empty list when there are no articles', async () => {
      expect(await repo.listTags()).toEqual([]);
    });

    it('returns the distinct union of tags across articles, sorted', async () => {
      await repo.create(newArticle({ slug: 'a', title: 'A', tagList: ['dragons', 'training'] }));
      await repo.create(newArticle({ slug: 'b', title: 'B', tagList: ['training', 'angularjs'] }));
      expect(await repo.listTags()).toEqual(['angularjs', 'dragons', 'training']);
    });

    it('omits tags whose only article has been soft-deleted', async () => {
      await repo.create(newArticle({ slug: 'a', title: 'A', tagList: ['kept', 'shared'] }));
      await repo.create(newArticle({ slug: 'b', title: 'B', tagList: ['dropped', 'shared'] }));
      await repo.delete('b');
      expect(await repo.listTags()).toEqual(['kept', 'shared']);
    });
  });
});
