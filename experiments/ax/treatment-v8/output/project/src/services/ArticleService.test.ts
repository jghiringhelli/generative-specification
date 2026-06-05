/**
 * Unit tests for {@link ArticleService}.
 *
 * The service is exercised over the in-memory repository fakes (working
 * implementations, not mocks): article, user, and follow-graph repositories.
 * These pin the behaviour the eight article endpoints depend on independently
 * of HTTP — slug derivation, author-only mutation, filter resolution, the feed,
 * favoriting, and the viewer-relative `favorited`/`following` flags.
 *
 * @gs-links: docs/specs/articles.md, docs/use-cases.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { InMemoryArticleRepository } from '../adapters/persistence/InMemoryArticleRepository.js';
import { InMemoryProfileRepository } from '../adapters/persistence/InMemoryProfileRepository.js';
import { InMemoryUserRepository } from '../adapters/persistence/InMemoryUserRepository.js';
import { ForbiddenError, NotFoundError } from '../errors/AppError.js';
import type { User } from '../repositories/IUserRepository.js';
import { ArticleService, type CreateArticleInput } from './ArticleService.js';

const draft: CreateArticleInput = {
  title: 'How To Train Your Dragon',
  description: 'Ever wonder how?',
  body: 'It takes a Jacobian',
  tagList: ['dragons', 'training'],
};

describe('ArticleService', () => {
  let articles: InMemoryArticleRepository;
  let users: InMemoryUserRepository;
  let follows: InMemoryProfileRepository;
  let service: ArticleService;
  let jane: User;
  let bob: User;

  beforeEach(async () => {
    articles = new InMemoryArticleRepository();
    users = new InMemoryUserRepository();
    follows = new InMemoryProfileRepository();
    service = new ArticleService(articles, users, follows);
    jane = await users.create({ email: 'jane@x.com', username: 'jane', passwordHash: 'h' });
    bob = await users.create({ email: 'bob@x.com', username: 'bob', passwordHash: 'h' });
  });

  describe('create', () => {
    it('derives a slug from the title and embeds the author', async () => {
      const view = await service.create(jane.id, draft);
      expect(view.slug).toBe('how-to-train-your-dragon');
      expect(view.author.username).toBe('jane');
      expect(view.tagList).toEqual(['dragons', 'training']);
      expect(view.favorited).toBe(false);
      expect(view.favoritesCount).toBe(0);
    });

    it('gives a second same-titled article a distinct slug', async () => {
      const first = await service.create(jane.id, draft);
      const second = await service.create(bob.id, draft);
      expect(second.slug).not.toBe(first.slug);
      expect(second.slug.startsWith('how-to-train-your-dragon-')).toBe(true);
    });

    it('trims, drops blanks, and de-duplicates the tag list', async () => {
      const view = await service.create(jane.id, {
        ...draft,
        tagList: [' dragons ', 'dragons', '', 'training'],
      });
      expect(view.tagList).toEqual(['dragons', 'training']);
    });

    it('throws NotFoundError when the author id resolves to no user', async () => {
      await expect(service.create('ghost-author', draft)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getBySlug', () => {
    it('returns the article with following=true when the viewer follows the author', async () => {
      const created = await service.create(jane.id, draft);
      await follows.follow(bob.id, jane.id);
      const view = await service.getBySlug(created.slug, bob.id);
      expect(view.author.following).toBe(true);
    });

    it('reports following=false and favorited=false for an anonymous viewer', async () => {
      const created = await service.create(jane.id, draft);
      const view = await service.getBySlug(created.slug);
      expect(view.author.following).toBe(false);
      expect(view.favorited).toBe(false);
    });

    it('throws NotFoundError for an unknown slug', async () => {
      await expect(service.getBySlug('ghost')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('update', () => {
    it('re-derives the slug when the title changes', async () => {
      const created = await service.create(jane.id, draft);
      const updated = await service.update(created.slug, jane.id, { title: 'A New Title' });
      expect(updated.slug).toBe('a-new-title');
      expect(updated.title).toBe('A New Title');
    });

    it('keeps the slug when the title is unchanged', async () => {
      const created = await service.create(jane.id, draft);
      const updated = await service.update(created.slug, jane.id, { body: 'rewritten' });
      expect(updated.slug).toBe(created.slug);
      expect(updated.body).toBe('rewritten');
    });

    it('forbids a non-author from updating', async () => {
      const created = await service.create(jane.id, draft);
      await expect(
        service.update(created.slug, bob.id, { title: 'Hijack' }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws NotFoundError for an unknown slug', async () => {
      await expect(service.update('ghost', jane.id, { body: 'x' })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('soft-deletes the author’s own article', async () => {
      const created = await service.create(jane.id, draft);
      await service.delete(created.slug, jane.id);
      await expect(service.getBySlug(created.slug)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('forbids a non-author from deleting', async () => {
      const created = await service.create(jane.id, draft);
      await expect(service.delete(created.slug, bob.id)).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('favorite / unfavorite', () => {
    it('favoriting marks favorited and counts it (idempotently)', async () => {
      const created = await service.create(jane.id, draft);
      const once = await service.favorite(created.slug, bob.id);
      expect(once.favorited).toBe(true);
      expect(once.favoritesCount).toBe(1);
      const twice = await service.favorite(created.slug, bob.id);
      expect(twice.favoritesCount).toBe(1);
    });

    it('unfavoriting clears the flag and count', async () => {
      const created = await service.create(jane.id, draft);
      await service.favorite(created.slug, bob.id);
      const view = await service.unfavorite(created.slug, bob.id);
      expect(view.favorited).toBe(false);
      expect(view.favoritesCount).toBe(0);
    });

    it('throws NotFoundError when favoriting an unknown slug', async () => {
      await expect(service.favorite('ghost', bob.id)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await service.create(jane.id, { ...draft, title: 'Jane One', tagList: ['react'] });
      await service.create(bob.id, { ...draft, title: 'Bob One', tagList: ['vue'] });
      await service.create(jane.id, { ...draft, title: 'Jane Two', tagList: ['react'] });
    });

    it('returns all articles newest first with a count', async () => {
      const page = await service.list({ limit: 20, offset: 0 });
      expect(page.articlesCount).toBe(3);
      expect(page.articles.map((a) => a.title)).toEqual(['Jane Two', 'Bob One', 'Jane One']);
    });

    it('filters by author username', async () => {
      const page = await service.list({ author: 'jane', limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.title)).toEqual(['Jane Two', 'Jane One']);
    });

    it('filters by tag', async () => {
      const page = await service.list({ tag: 'vue', limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.title)).toEqual(['Bob One']);
    });

    it('filters by favoriter username', async () => {
      const target = await service.list({ author: 'bob', limit: 20, offset: 0 });
      await service.favorite(target.articles[0]!.slug, jane.id);
      const page = await service.list({ favorited: 'jane', limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.title)).toEqual(['Bob One']);
    });

    it('returns an empty page when the author filter names an unknown user', async () => {
      const page = await service.list({ author: 'nobody', limit: 20, offset: 0 });
      expect(page.articlesCount).toBe(0);
      expect(page.articles).toEqual([]);
    });

    it('paginates while reporting the full total', async () => {
      const page = await service.list({ limit: 1, offset: 1 });
      expect(page.articlesCount).toBe(3);
      expect(page.articles.map((a) => a.title)).toEqual(['Bob One']);
    });
  });

  describe('feed', () => {
    it('returns only articles by followed authors, newest first', async () => {
      await service.create(jane.id, { ...draft, title: 'Jane One' });
      await service.create(bob.id, { ...draft, title: 'Bob One' });
      await service.create(jane.id, { ...draft, title: 'Jane Two' });
      await follows.follow(bob.id, jane.id);

      const page = await service.feed(bob.id, { limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.title)).toEqual(['Jane Two', 'Jane One']);
      expect(page.articlesCount).toBe(2);
    });

    it('is empty when the viewer follows no one', async () => {
      await service.create(jane.id, draft);
      const page = await service.feed(bob.id, { limit: 20, offset: 0 });
      expect(page.articles).toEqual([]);
      expect(page.articlesCount).toBe(0);
    });
  });
});
