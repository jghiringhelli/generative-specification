// tests/unit/CommentService.test.ts
import { CommentService } from '../../src/services/CommentService';
import { ICommentRepository } from '../../src/repositories/ICommentRepository';
import { ValidationError, NotFoundError, ForbiddenError } from '../../src/errors/AppError';

describe('CommentService Unit Tests', () => {
  let mockCommentRepository: jest.Mocked<ICommentRepository>;
  let commentService: CommentService;

  beforeEach(() => {
    mockCommentRepository = {
      create: jest.fn(),
      findByArticleSlug: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn()
    };
    commentService = new CommentService(mockCommentRepository);
  });

  describe('addComment', () => {
    it('should create comment with valid body', async () => {
      mockCommentRepository.create.mockResolvedValue({
        id: 1,
        body: 'Great article!',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'commenter',
          bio: null,
          image: null,
          following: false
        }
      });

      const result = await commentService.addComment('article-slug', 'u1', 'Great article!');
      expect(result.id).toBe(1);
      expect(result.body).toBe('Great article!');
      expect(mockCommentRepository.create).toHaveBeenCalledWith('article-slug', 'u1', 'Great article!');
    });

    it('should throw ValidationError if body is empty', async () => {
      await expect(
        commentService.addComment('article-slug', 'u1', '')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteComment', () => {
    it('should throw NotFoundError if comment does not exist', async () => {
      mockCommentRepository.findById.mockResolvedValue(null);

      await expect(
        commentService.deleteComment(999, 'u1')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if current user is not author', async () => {
      mockCommentRepository.findById.mockResolvedValue({
        id: 1,
        body: 'Comment text',
        createdAt: new Date(),
        updatedAt: new Date(),
        articleId: 'a1',
        authorId: 'original-author-id'
      });

      await expect(
        commentService.deleteComment(1, 'different-user-id')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should delete comment if current user is author', async () => {
      mockCommentRepository.findById.mockResolvedValue({
        id: 1,
        body: 'Comment text',
        createdAt: new Date(),
        updatedAt: new Date(),
        articleId: 'a1',
        authorId: 'u1'
      });
      mockCommentRepository.delete.mockResolvedValue();

      await expect(
        commentService.deleteComment(1, 'u1')
      ).resolves.toBeUndefined();

      expect(mockCommentRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
