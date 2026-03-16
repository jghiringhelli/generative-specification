
/**
 * Unit tests for CommentService.
 */

import { CommentService } from './comment.service';
import type { ICommentRepository, ICommentWithAuthor } from '../repositories/ICommentRepository';
import { NotFoundError, ForbiddenError } from '../errors/AppError';

const mockCommentRepository: jest.Mocked<ICommentRepository> = {
  findById: jest.fn(),
  getByArticleSlug: jest.fn(),
  create: jest.fn(),
  delete: jest.fn()
};

describe('CommentService', () => {
  let commentService: CommentService;

  beforeEach(() => {
    jest.clearAllMocks();
    commentService = new CommentService(mockCommentRepository);
  });

  describe('getCommentsByArticleSlug', () => {
    it('returns list of comments for article', async () => {
      const comments: ICommentWithAuthor[] = [
        {
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          body: 'Great article!',
          author: {
            username: 'commenter',
            bio: null,
            image: null,
            following: false
          }
        }
      ];

      mockCommentRepository.getByArticleSlug.mockResolvedValue(comments);

      const result = await commentService.getCommentsByArticleSlug('test-article', null);

      expect(mockCommentRepository.getByArticleSlug).toHaveBeenCalledWith('test-article', null);
      expect(result).toEqual(comments);
    });

    it('throws NotFoundError when article does not exist', async () => {
      mockCommentRepository.getByArticleSlug.mockRejectedValue(
        new NotFoundError('Article', 'nonexistent')
      );

      await expect(
        commentService.getCommentsByArticleSlug('nonexistent', null)
      ).rejects.toThrow(NotFoundError);
    });

    it('returns comments with following status when authenticated', async () => {
      const comments: ICommentWithAuthor[] = [
        {
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          body: 'Comment',
          author: {
            username: 'author',
            bio: null,
            image: null,
            following: true
          }
        }
      ];

      mockCommentRepository.getByArticleSlug.mockResolvedValue(comments);

      const result = await commentService.getCommentsByArticleSlug('test-article', 1);

      expect(result[0].author.following).toBe(true);
    });
  });

  describe('addComment', () => {
    it('creates comment and returns it with author', async () => {
      const comment: ICommentWithAuthor = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: 'New comment',
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          following: false
        }
      };

      mockCommentRepository.create.mockResolvedValue(comment);

      const result = await commentService.addComment('test-article', 'New comment', 1);

      expect(mockCommentRepository.create).toHaveBeenCalledWith('test-article', 'New comment', 1);
      expect(result.body).toBe('New comment');
      expect(result.author.username).toBe('testuser');
    });

    it('throws NotFoundError when article does not exist', async () => {
      mockCommentRepository.create.mockRejectedValue(
        new NotFoundError('Article', 'nonexistent')
      );

      await expect(
        commentService.addComment('nonexistent', 'Comment', 1)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment', () => {
    it('deletes comment when user is author', async () => {
      mockCommentRepository.delete.mockResolvedValue(undefined);

      await commentService.deleteComment(1, 1);

      expect(mockCommentRepository.delete).toHaveBeenCalledWith(1, 1);
    });

    it('throws NotFoundError when comment does not exist', async () => {
      mockCommentRepository.delete.mockRejectedValue(new NotFoundError('Comment', 999));

      await expect(commentService.deleteComment(999, 1)).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user is not author', async () => {
      mockCommentRepository.delete.mockRejectedValue(
        new ForbiddenError('Only the author can delete this comment')
      );

      await expect(commentService.deleteComment(1, 2)).rejects.toThrow(ForbiddenError);
    });
  });
});
