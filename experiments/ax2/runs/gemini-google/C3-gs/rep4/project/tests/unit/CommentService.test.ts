import { CommentService } from '../../src/services/CommentService';
import { ICommentRepository } from '../../src/repositories/ICommentRepository';
import { IArticleRepository } from '../../src/repositories/IArticleRepository';
import { IProfileRepository, ProfileData } from '../../src/repositories/IProfileRepository';
import { CommentEntity, ArticleEntity } from '../../src/types';
import { NotFoundError, ForbiddenError, ValidationError } from '../../src/errors/AppError';

class FakeCommentRepository implements ICommentRepository {
  private comments: CommentEntity[] = [];

  async findById(id: string): Promise<CommentEntity | null> {
    return this.comments.find((c) => c.id === id) || null;
  }

  async findByArticleSlug(slug: string): Promise<CommentEntity[]> {
    return this.comments.filter((c) => c.articleId === slug);
  }

  async create(articleId: string, authorId: string, body: string): Promise<CommentEntity> {
    const comment: CommentEntity = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      body,
      createdAt: new Date(),
      updatedAt: new Date(),
      articleId,
      authorId,
      author: {
        id: authorId,
        username: 'commenter',
        email: 'commenter@example.com',
        passwordHash: 'hash',
        bio: '',
        image: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    this.comments.push(comment);
    return comment;
  }

  async delete(id: string): Promise<void> {
    this.comments = this.comments.filter((c) => c.id !== id);
  }
}

class FakeArticleRepository implements Partial<IArticleRepository> {
  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    if (slug === 'non-existent') return null;
    return {
      id: slug,
      slug,
      title: 'Title',
      description: 'Desc',
      body: 'Body',
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 'author-1'
    };
  }
}

class FakeProfileRepository implements IProfileRepository {
  async findProfile(): Promise<ProfileData | null> {
    return null;
  }
  async follow(): Promise<ProfileData> {
    throw new Error('Not implemented');
  }
  async unfollow(): Promise<ProfileData> {
    throw new Error('Not implemented');
  }
  async isFollowing(): Promise<boolean> {
    return false;
  }
}

describe('CommentService Unit Tests', () => {
  let commentRepo: FakeCommentRepository;
  let articleRepo: any;
  let profileRepo: FakeProfileRepository;
  let commentService: CommentService;

  beforeEach(() => {
    commentRepo = new FakeCommentRepository();
    articleRepo = new FakeArticleRepository();
    profileRepo = new FakeProfileRepository();
    commentService = new CommentService(commentRepo, articleRepo, profileRepo);
  });

  it('creates comment successfully', async () => {
    const comment = await commentService.createComment('user-1', 'test-article', 'Great article!');
    expect(comment.body).toBe('Great article!');
    expect(comment.author.username).toBe('commenter');
  });

  it('rejects blank comment body', async () => {
    await expect(commentService.createComment('user-1', 'test-article', '')).rejects.toThrow(
      ValidationError
    );
  });

  it('throws NotFoundError when commenting on non-existent article', async () => {
    await expect(
      commentService.createComment('user-1', 'non-existent', 'Hello')
    ).rejects.toThrow(NotFoundError);
  });

  it('retrieves comments for an article', async () => {
    await commentService.createComment('user-1', 'test-article', 'First');
    await commentService.createComment('user-2', 'test-article', 'Second');

    const comments = await commentService.getComments('test-article');
    expect(comments.length).toBe(2);
  });

  it('deletes comment by author', async () => {
    const created = await commentService.createComment('user-1', 'test-article', 'To be deleted');
    await expect(commentService.deleteComment('user-1', created.id)).resolves.not.toThrow();
  });

  it('forbids deleting another user comment', async () => {
    const created = await commentService.createComment('user-1', 'test-article', 'Not yours');
    await expect(commentService.deleteComment('user-other', created.id)).rejects.toThrow(
      ForbiddenError
    );
  });
});
