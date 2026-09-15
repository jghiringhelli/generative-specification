import { CommentService } from '../../src/services/comment.service';
import { ICommentRepository } from '../../src/repositories/comment.repository';
import { IArticleRepository, ArticleWithRelations } from '../../src/repositories/article.repository';
import { IProfileRepository } from '../../src/repositories/profile.repository';
import { NotFoundError, ForbiddenError } from '../../src/utils/error.util';

describe('CommentService (unit)', () => {
  let mockCommentRepository: jest.Mocked<ICommentRepository>;
  let mockArticleRepository: jest.Mocked<IArticleRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let commentService: CommentService;

  const mockArticleRecord: ArticleWithRelations = {
    id: 1,
    slug: 'slug-1',
    title: 'Title',
    description: 'Desc',
    body: 'Body',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 10,
    author: {
      id: 10,
      username: 'author',
      bio: null,
      image: null
    },
    tags: [],
    favorites: [],
    _count: { favorites: 0 }
  };

  beforeEach(() => {
    mockCommentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByArticleId: jest.fn(),
      delete: jest.fn()
    };
    mockArticleRepository = {
      create: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      listArticles: jest.fn(),
      feedArticles: jest.fn(),
      favoriteArticle: jest.fn(),
      unfavoriteArticle: jest.fn()
    };
    mockProfileRepository = {
      findProfileByUsername: jest.fn(),
      followUser: jest.fn(),
      unfollowUser: jest.fn()
    };

    commentService = new CommentService(
      mockCommentRepository,
      mockArticleRepository,
      mockProfileRepository
    );
  });

  describe('addComment', () => {
    it('throws NotFoundError when commenting on non-existent article', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);

      await expect(
        commentService.addComment('ghost-slug', 1, { body: 'test' })
      ).rejects.toThrow(NotFoundError);
    });

    it('creates and returns comment payload on valid article', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticleRecord);
      mockCommentRepository.create.mockResolvedValue({
        id: 5,
        body: 'Great article',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 2,
        author: {
          id: 2,
          username: 'commenter',
          bio: null,
          image: null
        }
      });
      mockProfileRepository.findProfileByUsername.mockResolvedValue({
        username: 'commenter',
        bio: null,
        image: null,
        following: false
      });

      const result = await commentService.addComment('slug-1', 2, { body: 'Great article' });

      expect(result.comment.body).toBe('Great article');
      expect(result.comment.author.username).toBe('commenter');
    });
  });

  describe('deleteComment', () => {
    it('throws ForbiddenError when user tries to delete another users comment', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(mockArticleRecord);
      mockCommentRepository.findById.mockResolvedValue({
        id: 5,
        body: 'Great article',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 2,
        author: {
          id: 2,
          username: 'commenter',
          bio: null,
          image: null
        }
      });

      await expect(
        commentService.deleteComment('slug-1', 5, 999)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
