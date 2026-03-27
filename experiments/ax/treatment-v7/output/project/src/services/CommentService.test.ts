import { CommentService } from './CommentService';
import { InMemoryCommentRepository } from '../repositories/InMemoryCommentRepository';
import { InMemoryArticleRepository } from '../repositories/InMemoryArticleRepository';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type { Article, Comment } from '../types/domain';

/** Build a minimal Article fixture for seeding. */
function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 1,
    slug: 'test-slug',
    title: 'Test Title',
    description: 'Test description',
    body: 'Test body',
    authorId: 10,
    author: { username: 'author', bio: null, image: null, following: false },
    tagList: [],
    favoritesCount: 0,
    favorited: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/** Build a minimal Comment fixture for seeding. */
function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    body: 'Great article!',
    authorId: 20,
    articleId: 1,
    author: { username: 'commenter', bio: null, image: null, following: false },
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  };
}

describe('CommentService', () => {
  let articleRepo: InMemoryArticleRepository;
  let commentRepo: InMemoryCommentRepository;
  let service: CommentService;

  beforeEach(() => {
    articleRepo = new InMemoryArticleRepository();
    commentRepo = new InMemoryCommentRepository();
    service = new CommentService(commentRepo, articleRepo);
  });

  // ===========================================================================
  // getComments
  // ===========================================================================
  describe('getComments', () => {
    it('throws NotFoundError when article does not exist', async () => {
      await expect(service.getComments('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('returns empty array when article has no comments', async () => {
      articleRepo.seed([makeArticle()]);
      const comments = await service.getComments('test-slug');
      expect(comments).toEqual([]);
    });

    it('returns comments ordered by creation date descending', async () => {
      articleRepo.seed([makeArticle()]);
      commentRepo.seed({
        'test-slug': [
          makeComment({ id: 1, createdAt: new Date('2024-01-01') }),
          makeComment({ id: 2, createdAt: new Date('2024-01-03') }),
          makeComment({ id: 3, createdAt: new Date('2024-01-02') }),
        ],
      });
      const comments = await service.getComments('test-slug');
      expect(comments).toHaveLength(3);
      expect(comments[0].id).toBe(2);
      expect(comments[1].id).toBe(3);
      expect(comments[2].id).toBe(1);
    });
  });

  // ===========================================================================
  // addComment
  // ===========================================================================
  describe('addComment', () => {
    it('creates a comment and returns it with the correct body', async () => {
      articleRepo.seed([makeArticle()]);
      const comment = await service.addComment(20, 'test-slug', 'Nice post!');
      expect(comment.body).toBe('Nice post!');
      expect(comment.authorId).toBe(20);
    });

    it('comment appears in subsequent getComments call', async () => {
      articleRepo.seed([makeArticle()]);
      await service.addComment(20, 'test-slug', 'Hello world');
      const comments = await service.getComments('test-slug');
      expect(comments).toHaveLength(1);
      expect(comments[0].body).toBe('Hello world');
    });
  });

  // ===========================================================================
  // deleteComment
  // ===========================================================================
  describe('deleteComment', () => {
    it('throws NotFoundError when article does not exist', async () => {
      await expect(service.deleteComment(20, 'nonexistent', 1)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when comment does not exist', async () => {
      articleRepo.seed([makeArticle()]);
      await expect(service.deleteComment(20, 'test-slug', 999)).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user is not the comment author', async () => {
      articleRepo.seed([makeArticle()]);
      commentRepo.seed({ 'test-slug': [makeComment({ id: 1, authorId: 20 })] });
      await expect(service.deleteComment(99, 'test-slug', 1)).rejects.toThrow(ForbiddenError);
    });

    it('deletes the comment when user is the author', async () => {
      articleRepo.seed([makeArticle()]);
      commentRepo.seed({ 'test-slug': [makeComment({ id: 1, authorId: 20 })] });
      await expect(service.deleteComment(20, 'test-slug', 1)).resolves.toBeUndefined();
      const comments = await service.getComments('test-slug');
      expect(comments).toHaveLength(0);
    });

    it('checks article existence before comment existence', async () => {
      // Article does not exist; should throw NotFoundError for 'article', not 'comment'
      const error = await service.deleteComment(20, 'no-such-article', 1).catch((e) => e);
      expect(error).toBeInstanceOf(NotFoundError);
      expect((error as NotFoundError).resource).toBe('article');
    });

    it('throws NotFoundError with resource=comment when comment missing', async () => {
      articleRepo.seed([makeArticle()]);
      const error = await service.deleteComment(20, 'test-slug', 999).catch((e) => e);
      expect(error).toBeInstanceOf(NotFoundError);
      expect((error as NotFoundError).resource).toBe('comment');
    });
  });
});
