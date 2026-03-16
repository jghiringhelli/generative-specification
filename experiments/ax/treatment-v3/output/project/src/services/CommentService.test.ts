import { CommentService } from './CommentService';
import { ICommentRepository, CommentWithAuthor } from '../repositories/ICommentRepository';
import { IArticleRepository, ArticleWithRelations } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '../errors/AppError';

/**
 * Mock implementations for comment service tests.
 */
class MockCommentRepository implements ICommentRepository {
  private comments: CommentWithAuthor[] = [];
  private nextId = 1;

  async findById(id: number): Promise<CommentWithAuthor | null> {
    return this.comments.find((c) => c.id === id) || null;
  }

  async findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    return this.comments.filter((c) => c.articleId === articleId);
  }

  async create(data: {
    body: string;
    authorId: number;
    articleId: number;
  }): Promise<CommentWithAuthor> {
    const comment: CommentWithAuthor = {
      id: this.nextId++,
      body: data.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: data.authorId,
      articleId: data.articleId,
      author: {
        username: `user${data.authorId}`,
        bio: null,
        image: null
      }
    };
    this.comments.push(comment);
    return comment;
  }

  async delete(id: number): Promise<void> {
    this.comments = this.comments.filter((c) => c.id !== id);
  }

  reset(): void {
    this.comments = [];
    this.nextId = 1;
  }
}

class MockArticleRepository implements Partial<IArticleRepository> {
  private articles: ArticleWithRelations[] = [];

  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return this.articles.find((a) => a.slug === slug) || null;
  }

  addArticle(slug: string, authorId: number): ArticleWithRelations {
    const article: ArticleWithRelations = {
      id: this.articles.length + 1,
      slug,
      title: 'Test',
      description: 'Test',
      body: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId,
      author: { username: `user${authorId}`, bio: null, image: null, following: false },
      tags: [],
      favorited: false,
      favoritesCount: 0
    };
    this.articles.push(article);
    return article;
  }

  reset(): void {
    this.articles = [];
  }
}

class MockProfileRepository implements IProfileRepository {
  private follows: Set<string> = new Set();

  async findByUsername(): Promise<any> {
    return null;
  }

  async follow(): Promise<void> {}
  async unfollow(): Promise<void> {}

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.follows.has(`${followerId}-${followingId}`);
  }

  addFollow(followerId: number, followingId: number): void {
    this.follows.add(`${followerId}-${followingId}`);
  }

  reset(): void {
    this.follows.clear();
  }
}

describe('CommentService', () => {
  let commentRepository: MockCommentRepository;
  let articleRepository: MockArticleRepository;
  let profileRepository: MockProfileRepository;
  let service: CommentService;

  beforeEach(() => {
    commentRepository = new MockCommentRepository();
    articleRepository = new MockArticleRepository() as any;
    profileRepository = new MockProfileRepository();
    service = new CommentService(commentRepository, articleRepository as any, profileRepository);
  });

  describe('getComments', () => {
    it('get_comments_for_existing_article_returns_comments_array', async () => {
      const article = articleRepository.addArticle('test-article', 1);
      await commentRepository.create({
        body: 'Great article!',
        authorId: 2,
        articleId: article.id
      });

      const comments = await service.getComments('test-article');

      expect(comments).toHaveLength(1);
      expect(comments[0].body).toBe('Great article!');
      expect(comments[0].author.username).toBe('user2');
      expect(comments[0].author.following).toBe(false);
    });

    it('get_comments_with_following_status_returns_enriched_comments', async () => {
      const article = articleRepository.addArticle('test-article', 1);
      await commentRepository.create({
        body: 'Comment',
        authorId: 2,
        articleId: article.id
      });
      profileRepository.addFollow(3, 2); // User 3 follows author 2

      const comments = await service.getComments('test-article', 3);

      expect(comments[0].author.following).toBe(true);
    });

    it('get_comments_for_nonexistent_article_throws_not_found_error', async () => {
      await expect(service.getComments('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('get_comments_for_article_with_no_comments_returns_empty_array', async () => {
      articleRepository.addArticle('test-article', 1);

      const comments = await service.getComments('test-article');

      expect(comments).toHaveLength(0);
    });
  });

  describe('addComment', () => {
    it('add_comment_to_existing_article_returns_comment', async () => {
      const article = articleRepository.addArticle('test-article', 1);

      const comment = await service.addComment('test-article', { body: 'Nice work!' }, 2);

      expect(comment.body).toBe('Nice work!');
      expect(comment.author.username).toBe('user2');
      expect(comment.id).toBeDefined();
    });

    it('add_comment_to_nonexistent_article_throws_not_found_error', async () => {
      await expect(
        service.addComment('nonexistent', { body: 'Comment' }, 1)
      ).rejects.toThrow(NotFoundError);
    });

    it('add_comment_with_empty_body_throws_validation_error', async () => {
      articleRepository.addArticle('test-article', 1);

      await expect(service.addComment('test-article', { body: '   ' }, 2)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('deleteComment', () => {
    it('delete_comment_by_author_succeeds', async () => {
      const article = articleRepository.addArticle('test-article', 1);
      const comment = await commentRepository.create({
        body: 'To be deleted',
        authorId: 2,
        articleId: article.id
      });

      await service.deleteComment('test-article', comment.id, 2);

      const found = await commentRepository.findById(comment.id);
      expect(found).toBeNull();
    });

    it('delete_comment_by_non_author_throws_authorization_error', async () => {
      const article = articleRepository.addArticle('test-article', 1);
      const comment = await commentRepository.create({
        body: 'Comment',
        authorId: 2,
        articleId: article.id
      });

      await expect(service.deleteComment('test-article', comment.id, 3)).rejects.toThrow(
        AuthorizationError
      );
    });

    it('delete_nonexistent_comment_throws_not_found_error', async () => {
      articleRepository.addArticle('test-article', 1);

      await expect(service.deleteComment('test-article', 999, 2)).rejects.toThrow(NotFoundError);
    });

    it('delete_comment_for_nonexistent_article_throws_not_found_error', async () => {
      await expect(service.deleteComment('nonexistent', 1, 2)).rejects.toThrow(NotFoundError);
    });

    it('delete_comment_from_different_article_throws_not_found_error', async () => {
      const article1 = articleRepository.addArticle('article-1', 1);
      articleRepository.addArticle('article-2', 1);
      const comment = await commentRepository.create({
        body: 'Comment on article 1',
        authorId: 2,
        articleId: article1.id
      });

      await expect(service.deleteComment('article-2', comment.id, 2)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
