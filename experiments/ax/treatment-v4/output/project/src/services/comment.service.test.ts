import { CommentService } from './comment.service';
import { ICommentRepository, CommentEntity } from '../repositories/ICommentRepository';
import { IArticleRepository, ArticleEntity } from '../repositories/IArticleRepository';
import { NotFoundError, AuthorizationError } from '../errors/AppError';

// Mock repositories
class MockCommentRepository implements ICommentRepository {
  private comments: CommentEntity[] = [];
  private nextId = 1;

  async create(data: any): Promise<CommentEntity> {
    const comment: CommentEntity = {
      id: this.nextId++,
      body: data.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        username: 'testauthor',
        bio: null,
        image: null,
        following: false
      },
      authorId: data.authorId
    };
    this.comments.push(comment);
    return comment;
  }

  async listByArticle(): Promise<CommentEntity[]> {
    return this.comments;
  }

  async findById(id: number): Promise<CommentEntity | null> {
    return this.comments.find(c => c.id === id) || null;
  }

  async delete(id: number): Promise<void> {
    this.comments = this.comments.filter(c => c.id !== id);
  }
}

class MockArticleRepository implements IArticleRepository {
  private articles: Map<string, ArticleEntity> = new Map();

  addArticle(article: ArticleEntity): void {
    this.articles.set(article.slug, article);
  }

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    return this.articles.get(slug) || null;
  }

  async slugExists(): Promise<boolean> { return false; }
  async create(): Promise<ArticleEntity> { throw new Error('Not implemented'); }
  async update(): Promise<ArticleEntity> { throw new Error('Not implemented'); }
  async delete(): Promise<void> {}
  async list(): Promise<any> { return { articles: [], articlesCount: 0 }; }
  async getFeed(): Promise<any> { return { articles: [], articlesCount: 0 }; }
  async favorite(): Promise<ArticleEntity> { throw new Error('Not implemented'); }
  async unfavorite(): Promise<ArticleEntity> { throw new Error('Not implemented'); }
}

describe('CommentService', () => {
  let commentService: CommentService;
  let mockCommentRepo: MockCommentRepository;
  let mockArticleRepo: MockArticleRepository;

  beforeEach(() => {
    mockCommentRepo = new MockCommentRepository();
    mockArticleRepo = new MockArticleRepository();
    commentService = new CommentService(mockCommentRepo, mockArticleRepo);

    // Add test article
    mockArticleRepo.addArticle({
      id: 1,
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test',
      body: 'Test body',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        username: 'author',
        bio: null,
        image: null,
        following: false
      },
      tagList: [],
      favorited: false,
      favoritesCount: 0
    });
  });

  describe('getComments', () => {
    it('get_comments_for_existing_article_returns_array', async () => {
      await mockCommentRepo.create({
        body: 'Test comment',
        authorId: 1,
        articleSlug: 'test-article'
      });

      const comments = await commentService.getComments('test-article');

      expect(comments).toHaveLength(1);
      expect(comments[0].body).toBe('Test comment');
    });

    it('get_comments_for_nonexistent_article_throws_NotFoundError', async () => {
      await expect(
        commentService.getComments('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });

    it('get_comments_for_article_with_no_comments_returns_empty_array', async () => {
      const comments = await commentService.getComments('test-article');

      expect(comments).toHaveLength(0);
    });
  });

  describe('addComment', () => {
    it('add_comment_to_existing_article_returns_comment', async () => {
      const comment = await commentService.addComment(
        'test-article',
        { body: 'Great article!' },
        1
      );

      expect(comment.body).toBe('Great article!');
      expect(comment.id).toBeDefined();
      expect(comment.author).toBeDefined();
    });

    it('add_comment_to_nonexistent_article_throws_NotFoundError', async () => {
      await expect(
        commentService.addComment('nonexistent', { body: 'Comment' }, 1)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment', () => {
    it('delete_comment_by_author_removes_comment', async () => {
      const comment = await mockCommentRepo.create({
        body: 'To delete',
        authorId: 1,
        articleSlug: 'test-article'
      });

      await commentService.deleteComment(comment.id, 1);

      const found = await mockCommentRepo.findById(comment.id);
      expect(found).toBeNull();
    });

    it('delete_comment_by_non_author_throws_AuthorizationError', async () => {
      const comment = await mockCommentRepo.create({
        body: 'Someone elses comment',
        authorId: 1,
        articleSlug: 'test-article'
      });

      await expect(
        commentService.deleteComment(comment.id, 2)
      ).rejects.toThrow(AuthorizationError);
    });

    it('delete_nonexistent_comment_throws_NotFoundError', async () => {
      await expect(
        commentService.deleteComment(999, 1)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
