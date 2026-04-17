import { CommentService } from './comment.service';
import { ICommentRepository, CommentWithAuthor } from '../repositories/comment.repository';
import { IArticleRepository, ArticleWithRelations } from '../repositories/article.repository';
import { IProfileRepository } from '../repositories/profile.repository';
import { NotFoundError, AuthorizationError } from '../errors';

describe('CommentService', () => {
  let commentService: CommentService;
  let mockCommentRepository: jest.Mocked<ICommentRepository>;
  let mockArticleRepository: jest.Mocked<IArticleRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;

  const mockArticle: ArticleWithRelations = {
    id: 1,
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test',
    body: 'Test',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 1,
    author: {
      id: 1,
      username: 'author',
      bio: null,
      image: null
    },
    tags: [],
    favoritedBy: [],
    _count: { favoritedBy: 0 }
  };

  const mockComment: CommentWithAuthor = {
    id: 1,
    body: 'Test comment',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    authorId: 2,
    articleId: 1,
    author: {
      id: 2,
      username: 'commenter',
      bio: null,
      image: null
    }
  };

  beforeEach(() => {
    mockCommentRepository = {
      findById: jest.fn(),
      findByArticleSlug: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    };

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

    mockProfileRepository = {
      isFollowing: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
      getFollowerCount: jest.fn(),
      getFollowingCount: jest.fn()
    };

    commentService = new CommentService(
      mockCommentRepository,
      mockArticleRepository,
      mockProfileRepository
    );
  });

  describe('getComments', () => {
    it('get_comments_for_existing_article_returns_comments_list', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentRepository.findByArticleSlug.mockResolvedValue([mockComment]);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await commentService.getComments('test-article');

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toMatchObject({
        id: 1,
        body: 'Test comment',
        author: {
          username: 'commenter',
          following: false
        }
      });
    });

    it('get_comments_for_nonexistent_article_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(
        commentService.getComments('nonexistent')
      ).rejects.toThrow('Article');
    });

    it('get_comments_with_auth_shows_following_status', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentRepository.findByArticleSlug.mockResolvedValue([mockComment]);
      mockProfileRepository.isFollowing.mockResolvedValue(true);

      const result = await commentService.getComments('test-article', 1);

      expect(result.comments[0].author.following).toBe(true);
    });
  });

  describe('addComment', () => {
    it('add_comment_to_existing_article_returns_created_comment', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentRepository.create.mockResolvedValue(mockComment);
      mockProfileRepository.isFollowing.mockResolvedValue(false);

      const result = await commentService.addComment(
        'test-article',
        { body: 'Test comment' },
        2
      );

      expect(result).toMatchObject({
        id: 1,
        body: 'Test comment',
        author: {
          username: 'commenter'
        }
      });
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        body: 'Test comment',
        authorId: 2,
        articleId: 1
      });
    });

    it('add_comment_to_nonexistent_article_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(
        commentService.addComment('nonexistent', { body: 'Test' }, 1)
      ).rejects.toThrow('Article');
    });
  });

  describe('deleteComment', () => {
    it('delete_comment_by_author_succeeds', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentRepository.findById.mockResolvedValue(mockComment);
      mockCommentRepository.delete.mockResolvedValue();

      await commentService.deleteComment('test-article', 1, 2);

      expect(mockCommentRepository.delete).toHaveBeenCalledWith(1);
    });

    it('delete_comment_by_non_author_throws_authorization_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentRepository.findById.mockResolvedValue(mockComment);

      await expect(
        commentService.deleteComment('test-article', 1, 999)
      ).rejects.toThrow('Only the comment author can delete this comment');
    });

    it('delete_nonexistent_comment_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentRepository.findById.mockResolvedValue(null);

      await expect(
        commentService.deleteComment('test-article', 999, 1)
      ).rejects.toThrow('Comment');
    });

    it('delete_comment_for_nonexistent_article_throws_not_found_error', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);
      mockCommentRepository.findById.mockResolvedValue(mockComment);

      await expect(
        commentService.deleteComment('nonexistent', 1, 1)
      ).rejects.toThrow('Article');
    });
  });
});
