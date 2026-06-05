/**
 * Unit tests for {@link InMemoryCommentRepository}.
 *
 * The fake is a working implementation of the comment persistence port, so it is
 * tested as a unit: per-article scoping, newest-first ordering, find-by-id, and
 * soft-delete exclusion from every read.
 *
 * @gs-links: docs/specs/comments.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { NotFoundError } from '../../errors/AppError.js';
import type { NewComment } from '../../repositories/ICommentRepository.js';
import { InMemoryCommentRepository } from './InMemoryCommentRepository.js';

function newComment(overrides: Partial<NewComment> = {}): NewComment {
  return { body: 'nice', articleId: 'article-1', authorId: 'author-1', ...overrides };
}

describe('InMemoryCommentRepository', () => {
  let repo: InMemoryCommentRepository;

  beforeEach(() => {
    repo = new InMemoryCommentRepository();
  });

  describe('create + findById', () => {
    it('persists a comment and finds it by id', async () => {
      const created = await repo.create(newComment({ body: 'first' }));
      const found = await repo.findById(created.id);
      expect(found?.id).toBe(created.id);
      expect(found?.body).toBe('first');
      expect(found?.articleId).toBe('article-1');
      expect(found?.authorId).toBe('author-1');
    });

    it('returns null for an unknown id', async () => {
      expect(await repo.findById(999)).toBeNull();
    });
  });

  describe('listByArticle', () => {
    it('returns only the article’s comments, newest first', async () => {
      const a = await repo.create(newComment({ body: 'a', articleId: 'art' }));
      const b = await repo.create(newComment({ body: 'b', articleId: 'art' }));
      await repo.create(newComment({ body: 'other', articleId: 'different' }));

      const list = await repo.listByArticle('art');
      expect(list.map((c) => c.id)).toEqual([b.id, a.id]);
    });

    it('returns an empty list for an article with no comments', async () => {
      expect(await repo.listByArticle('art')).toEqual([]);
    });
  });

  describe('delete (soft)', () => {
    it('excludes a soft-deleted comment from findById and listByArticle', async () => {
      const created = await repo.create(newComment({ articleId: 'art' }));
      await repo.delete(created.id);
      expect(await repo.findById(created.id)).toBeNull();
      expect(await repo.listByArticle('art')).toEqual([]);
    });

    it('rejects deleting an unknown or already-deleted id', async () => {
      const created = await repo.create(newComment());
      await repo.delete(created.id);
      await expect(repo.delete(created.id)).rejects.toBeInstanceOf(NotFoundError);
      await expect(repo.delete(999)).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
