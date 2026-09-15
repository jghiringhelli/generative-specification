import { ForbiddenError, NotFoundError } from '../../src/errors/app-error';
import { ArticleRepository } from '../../src/repositories/article.repository';
import { CommentRepository, CommentWithAuthor } from '../../src/repositories/comment.repository';
import { UserRepository } from '../../src/repositories/user.repository';
import { CommentService } from '../../src/services/comment.service';

describe('CommentService Unit Tests', () => {
  let mockCommentRepo: jest.Mocked<CommentRepository>;
  let mockArticleRepo: jest.Mocked<ArticleRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let commentService: CommentService;

  const mockComment: CommentWithAuthor = {
    id: 5,
    body: 'Sample comment body',
    articleId: 10,
    authorId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 2,
      username: 'bob',
      email: 'bob@example.com',
      password: 'hash',
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    mockCommentRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByArticleId: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CommentRepository>;

    mockArticleRepo = {
      findBySlug: jest.fn(),
    } as unknown as jest.Mocked<ArticleRepository>;

    mockUserRepo = {
      isFollowing: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<UserRepository>;

    commentService = new CommentService(mockCommentRepo, mockArticleRepo, mockUserRepo);
  });

  it('adds comment to article and returns formatted comment DTO', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue({ id: 10 } as any);
    mockCommentRepo.create.mockResolvedValue(mockComment);

    const result = await commentService.addComment('article-slug', 2, { body: 'Sample comment body' });

    expect(result.id).toBe(5);
    expect(result.body).toBe('Sample comment body');
    expect(result.author.username).toBe('bob');
  });

  it('throws NotFoundError when adding comment to nonexistent article', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue(null);

    await expect(
      commentService.addComment('missing-slug', 2, { body: 'Text' })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when non-author attempts to delete comment', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue({ id: 10 } as any);
    mockCommentRepo.findById.mockResolvedValue(mockComment);

    await expect(
      commentService.deleteComment('article-slug', 5, 99)
    ).rejects.toThrow(ForbiddenError);
  });

  it('deletes comment successfully when called by comment author', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue({ id: 10 } as any);
    mockCommentRepo.findById.mockResolvedValue(mockComment);
    mockCommentRepo.delete.mockResolvedValue(undefined);

    await commentService.deleteComment('article-slug', 5, 2);

    expect(mockCommentRepo.delete).toHaveBeenCalledWith(5);
  });
});
