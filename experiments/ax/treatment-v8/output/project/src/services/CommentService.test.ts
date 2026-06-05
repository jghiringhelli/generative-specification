/**
 * Unit tests for {@link CommentService}.
 *
 * The service is exercised over the in-memory repository fakes (working
 * implementations, not mocks): comment, article, user, and follow-graph
 * repositories. These pin the behaviour the three comment endpoints depend on
 * independently of HTTP — article resolution (404), newest-first listing,
 * author-only deletion (403), the article/comment ownership check, and the
 * viewer-relative `following` flag.
 *
 * @gs-links: docs/specs/comments.md, docs/use-cases.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { InMemoryArticleRepository } from '../adapters/persistence/InMemoryArticleRepository.js';
import { InMemoryCommentRepository } from '../adapters/persistence/InMemoryCommentRepository.js';
import { InMemoryProfileRepository } from '../adapters/persistence/InMemoryProfileRepository.js';
import { InMemoryUserRepository } from '../adapters/persistence/InMemoryUserRepository.js';
import { ForbiddenError, NotFoundError } from '../errors/AppError.js';
import type { Article } from '../repositories/IArticleRepository.js';
import type { User } from '../repositories/IUserRepository.js';
import { CommentService } from './CommentService.js';

describe('CommentService', () => {
  let comments: InMemoryCommentRepository;
  let articles: InMemoryArticleRepository;
  let users: InMemoryUserRepository;
  let follows: InMemoryProfileRepository;
  let service: CommentService;
  let jane: User;
  let bob: User;
  let article: Article;

  beforeEach(async () => {
    comments = new InMemoryCommentRepository();
    articles = new InMemoryArticleRepository();
    users = new InMemoryUserRepository();
    follows = new InMemoryProfileRepository();
    service = new CommentService(comments, articles, users, follows);
    jane = await users.create({ email: 'jane@x.com', username: 'jane', passwordHash: 'h' });
    bob = await users.create({ email: 'bob@x.com', username: 'bob', passwordHash: 'h' });
    article = await articles.create({
      slug: 'how-to',
      title: 'How To',
      description: 'd',
      body: 'b',
      tagList: [],
      authorId: jane.id,
    });
  });

  describe('add', () => {
    it('adds a comment and embeds the author', async () => {
      const view = await service.add(article.slug, bob.id, 'great post');
      expect(view.body).toBe('great post');
      expect(view.author.username).toBe('bob');
      expect(view.author.following).toBe(false);
      expect(view.id).toEqual(expect.any(Number));
    });

    it('throws NotFoundError for an unknown slug', async () => {
      await expect(service.add('ghost', bob.id, 'x')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when the author id resolves to no user', async () => {
      await expect(service.add(article.slug, 'ghost-author', 'x')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('listForArticle', () => {
    it('returns the article’s comments newest first', async () => {
      await service.add(article.slug, bob.id, 'first');
      await service.add(article.slug, jane.id, 'second');
      const list = await service.listForArticle(article.slug);
      expect(list.map((c) => c.body)).toEqual(['second', 'first']);
    });

    it('reflects the viewer’s follow edge in the embedded author', async () => {
      await service.add(article.slug, jane.id, 'mine');
      await follows.follow(bob.id, jane.id);
      const list = await service.listForArticle(article.slug, bob.id);
      expect(list[0]?.author.following).toBe(true);
    });

    it('reports following=false for an anonymous viewer', async () => {
      await service.add(article.slug, jane.id, 'mine');
      const list = await service.listForArticle(article.slug);
      expect(list[0]?.author.following).toBe(false);
    });

    it('throws NotFoundError for an unknown slug', async () => {
      await expect(service.listForArticle('ghost')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('delete', () => {
    it('lets the comment author delete it, after which it disappears', async () => {
      const created = await service.add(article.slug, bob.id, 'mine to remove');
      await service.delete(article.slug, created.id, bob.id);
      const list = await service.listForArticle(article.slug);
      expect(list).toEqual([]);
    });

    it('forbids a non-author from deleting with ForbiddenError', async () => {
      const created = await service.add(article.slug, bob.id, 'bob owns this');
      await expect(service.delete(article.slug, created.id, jane.id)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it('throws NotFoundError for an unknown comment id', async () => {
      await expect(service.delete(article.slug, 999, bob.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws NotFoundError when the comment belongs to a different article', async () => {
      const other = await articles.create({
        slug: 'other',
        title: 'Other',
        description: 'd',
        body: 'b',
        tagList: [],
        authorId: jane.id,
      });
      const created = await service.add(other.slug, bob.id, 'on other');
      await expect(service.delete(article.slug, created.id, bob.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws NotFoundError when the slug is unknown', async () => {
      const created = await service.add(article.slug, bob.id, 'x');
      await expect(service.delete('ghost', created.id, bob.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
