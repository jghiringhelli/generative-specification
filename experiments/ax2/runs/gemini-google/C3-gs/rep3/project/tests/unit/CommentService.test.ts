// tests/unit/CommentService.test.ts
import { CommentService } from '../../src/services/CommentService';
import { ICommentRepository, CommentRecord, CreateCommentData } from '../../src/repositories/ICommentRepository';
import { IArticleRepository, ArticleRecord } from '../../src/repositories/IArticleRepository';
import { IProfileRepository, ProfileRecord } from '../../src/repositories/IProfileRepository';
import { ValidationError, NotFoundError, ForbiddenError } from '../../src/errors/AppError';

class MockCommentRepository implements ICommentRepository {
  public comments: CommentRecord[] = [];

  public async create(data: CreateCommentData): Promise<CommentRecord> {
    const comment: CommentRecord = {
      id: `comment-${Date.now()}-${Math.random()}`,
      body: data.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      articleId: data.articleId,
      authorId: data.authorId,
      author: {
        id: data.authorId,
        username: `user_${data.authorId}`,
        bio: null,
        image: null
      }
    };
    this.comments.push(comment);
    return comment;
  }

  public async findById(id: string): Promise<CommentRecord | null> {
    return this.comments.find(c => c.id === id) || null;
  }

  public async delete(id: string): Promise<void> {
    const index = this.comments.findIndex(c => c.id === id);
    if (index === -1) throw new NotFoundError('Comment not found');
    this.comments.splice(index, 1);
  }

  public async findByArticleSlug(_slug: string): Promise<CommentRecord[]> {
    return this.comments;
  }
}

class MockArticleRepository implements Partial<IArticleRepository> {
  public async findBySlug(slug: string): Promise<ArticleRecord | null> {
    if (slug === 'valid-slug') {
      return {
        id: 'article-1',
        slug: 'valid-slug',
        title: 'Title',
        description: 'Desc',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 'author-1',
        author: { id: 'author-1', username: 'author', bio: null, image: null },
        favoritesCount: 0
      };
    }
    return null;
  }
}

class MockProfileRepository implements Partial<IProfileRepository> {
  public async isFollowing(_followerId: string, _targetUserId: string): Promise<boolean> {
    return false;
  }
}

describe('CommentService', () => {
  let commentRepository: MockCommentRepository;
  let articleRepository: any;
  let profileRepository: any;
  let commentService: CommentService;

  beforeEach(() => {
    commentRepository = new MockCommentRepository();
    articleRepository = new MockArticleRepository();
    profileRepository = new MockProfileRepository();
    commentService = new CommentService(commentRepository, articleRepository, profileRepository);
  });

  describe('addComment', () => {
    it('creates a comment for an existing article', async () => {
      const comment = await commentService.addComment('user1', 'valid-slug', 'Great article!');
      expect(comment.body).toBe('Great article!');
      expect(comment.id).toBeDefined();
      expect(comment.author).toBeDefined();
    });

    it('rejects blank comment body', async () => {
      await expect(
        commentService.addComment('user1', 'valid-slug', '   ')
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError if article does not exist', async () => {
      await expect(
        commentService.addComment('user1', 'non-existent', 'Nice post')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getComments', () => {
    it('returns all comments for an article', async () => {
      await commentService.addComment('user1', 'valid-slug', 'First comment');
      await commentService.addComment('user2', 'valid-slug', 'Second comment');

      const comments = await commentService.getComments('valid-slug');
      expect(comments.length).toBe(2);
    });

    it('throws NotFoundError when article does not exist', async () => {
      await expect(commentService.getComments('unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment', () => {
    it('allows author to delete their comment', async () => {
      const comment = await commentService.addComment('user1', 'valid-slug', 'Will delete');
      await commentService.deleteComment('user1', comment.id);
      expect(commentRepository.comments.length).toBe(0);
    });

    it('forbids non-author from deleting comment', async () => {
      const comment = await commentService.addComment('user1', 'valid-slug', 'My comment');
      await expect(
        commentService.deleteComment('user2', comment.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError when deleting non-existent comment', async () => {
      await expect(
        commentService.deleteComment('user1', 'missing-comment-id')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
