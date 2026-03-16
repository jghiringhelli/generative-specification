import { CommentService } from './comment.service';
import { CommentRepository } from '../repositories/comment.repository';
import { NotFoundError } from '../errors/NotFoundError';
import { AuthorizationError } from '../errors/AuthorizationError';

jest.mock('../repositories/comment.repository');

describe('CommentService', () => {
  let commentService: CommentService;
  let mockCommentRepository: jest.Mocked<CommentRepository>;

  const mockComment = {
    id: 1,
    body: 'It takes a Jacobian',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    authorId: 1,
    articleId: 1,
    author: {
      id: 1,
      username: 'jake',
      bio: 'I work at statefarm',
      image: 'https://example.com/jake.jpg',
      followedBy: [],
    },
  };

  beforeEach(() => {
    mockCommentRepository = new CommentRepository({} as any) as jest.Mocked<CommentRepository>;
    commentService = new CommentService(mockCommentRepository);
  });

  describe('getComments', () => {
    it('getComments_returns_all_comments_for_article', async () => {
      mockCommentRepository.findByArticleSlug = jest.fn().mockResolvedValue([mockComment]);

      const result = await commentService.getComments('test-article');

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].body).toBe('It takes a Jacobian');
      expect(mockCommentRepository.findByArticleSlug).toHaveBeenCalledWith(
        'test-article',
        undefined
      );
    });

    it('getComments_with_authenticated_user_passes_userId', async () => {
      const commentWithFollowing = {
        ...mockComment,
        author: { ...mockComment.author, followedBy: [{ followerId: 2 }] },
      };
      mockCommentRepository.findByArticleSlug = jest.fn().mockResolvedValue([commentWithFollowing]);

      const result = await commentService.getComments('test-article', 2);

      expect(result.comments[0].author.following).toBe(true);
      expect(mockCommentRepository.findByArticleSlug).toHaveBeenCalledWith('test-article', 2);
    });

    it('getComments_for_article_with_no_comments_returns_empty_array', async () => {
      mockCommentRepository.findByArticleSlug = jest.fn().mockResolvedValue([]);

      const result = await commentService.getComments('test-article');

      expect(result.comments).toEqual([]);
    });
  });

  describe('addComment', () => {
    it('addComment_with_valid_data_returns_comment', async () => {
      mockCommentRepository.create = jest.fn().mockResolvedValue(mockComment);

      const result = await commentService.addComment('test-article', 'Great article!', 1);

      expect(result.comment.body).toBe('It takes a Jacobian');
      expect(result.comment.author.username).toBe('jake');
      expect(mockCommentRepository.create).toHaveBeenCalledWith(
        {
          body: 'Great article!',
          authorId: 1,
          articleSlug: 'test-article',
        },
        1
      );
    });

    it('addComment_to_nonexistent_article_throws_NotFoundError', async () => {
      mockCommentRepository.create = jest.fn().mockRejectedValue(new Error('Article not found'));

      await expect(commentService.addComment('nonexistent', 'Comment', 1)).rejects.toThrow(
        NotFoundError
      );
      await expect(commentService.addComment('nonexistent', 'Comment', 1)).rejects.toThrow(
        'Article not found'
      );
    });
  });

  describe('deleteComment', () => {
    it('deleteComment_by_author_succeeds', async () => {
      mockCommentRepository.findById = jest.fn().mockResolvedValue(mockComment);
      mockCommentRepository.delete = jest.fn().mockResolvedValue(undefined);

      await commentService.deleteComment(1, 1);

      expect(mockCommentRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deleteComment_by_non_author_throws_AuthorizationError', async () => {
      mockCommentRepository.findById = jest.fn().mockResolvedValue(mockComment);

      await expect(commentService.deleteComment(1, 999)).rejects.toThrow(AuthorizationError);
      await expect(commentService.deleteComment(1, 999)).rejects.toThrow(
        'only author can delete comment'
      );
    });

    it('deleteComment_with_nonexistent_id_throws_NotFoundError', async () => {
      mockCommentRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(commentService.deleteComment(999, 1)).rejects.toThrow(NotFoundError);
      await expect(commentService.deleteComment(999, 1)).rejects.toThrow('Comment not found');
    });
  });
});
