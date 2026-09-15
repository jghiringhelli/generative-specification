import request from 'supertest';
import { createApp } from '../../src/app';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from '../../src/repositories/IUserRepository';
import {
  IProfileRepository,
  ProfileEntity,
} from '../../src/repositories/IProfileRepository';
import {
  ArticleEntity,
  ArticleFeedOptions,
  ArticleQueryOptions,
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from '../../src/repositories/IArticleRepository';
import {
  CommentEntity,
  CreateCommentData,
  ICommentRepository,
} from '../../src/repositories/ICommentRepository';
import { AuthService } from '../../src/services/AuthService';

class FakeUserRepository implements IUserRepository {
  public users: UserEntity[] = [];
  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.username === username) ?? null;
  }
  async create(data: CreateUserData): Promise<UserEntity> {
    const user: UserEntity = {
      id: `user-${Date.now()}-${Math.random()}`,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: '',
      image: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const u = await this.findById(id);
    Object.assign(u!, data);
    return u!;
  }
}

class FakeProfileRepository implements IProfileRepository {
  async findByUsername(_username: string): Promise<ProfileEntity | null> {
    return null;
  }
  async follow(_followerId: string, _followingId: string): Promise<void> {}
  async unfollow(_followerId: string, _followingId: string): Promise<void> {}
  async isFollowing(_followerId: string, _followingId: string): Promise<boolean> {
    return false;
  }
}

class FakeArticleRepository implements IArticleRepository {
  public articles: ArticleEntity[] = [];

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    return this.articles.find((a) => a.slug === slug) ?? null;
  }
  async list(_options: ArticleQueryOptions): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    return { articles: this.articles, articlesCount: this.articles.length };
  }
  async listFeed(_userId: string, _options: ArticleFeedOptions): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    return { articles: this.articles, articlesCount: this.articles.length };
  }
  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const article: ArticleEntity = {
      id: 'article-1',
      slug: 'comment-test-article',
      title: data.title,
      description: data.description,
      body: data.body,
      tagList: data.tagList ?? [],
      authorId: data.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.articles.push(article);
    return article;
  }
  async update(_slug: string, _data: UpdateArticleData): Promise<ArticleEntity> {
    return this.articles[0];
  }
  async delete(_slug: string): Promise<void> {}
  async favorite(_articleId: string, _userId: string): Promise<void> {}
  async unfavorite(_articleId: string, _userId: string): Promise<void> {}
  async isFavorited(_articleId: string, _userId: string): Promise<boolean> {
    return false;
  }
  async getFavoritesCount(_articleId: string): Promise<number> {
    return 0;
  }
}

class FakeCommentRepository implements ICommentRepository {
  public comments: CommentEntity[] = [];

  async findById(id: string): Promise<CommentEntity | null> {
    return this.comments.find((c) => c.id === id) ?? null;
  }
  async findByArticleSlug(_slug: string): Promise<CommentEntity[]> {
    return this.comments;
  }
  async create(data: CreateCommentData): Promise<CommentEntity> {
    const comment: CommentEntity = {
      id: `comment-${Date.now()}-${Math.random()}`,
      body: data.body,
      authorId: data.authorId,
      articleId: data.articleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.comments.push(comment);
    return comment;
  }
  async delete(id: string): Promise<void> {
    this.comments = this.comments.filter((c) => c.id !== id);
  }
}

describe('Comment Endpoints (Integration)', () => {
  let userRepo: FakeUserRepository;
  let profileRepo: FakeProfileRepository;
  let articleRepo: FakeArticleRepository;
  let commentRepo: FakeCommentRepository;
  let app: any;
  let authService: AuthService;
  let user1: UserEntity;
  let user2: UserEntity;
  let token1: string;
  let token2: string;

  beforeEach(async () => {
    userRepo = new FakeUserRepository();
    profileRepo = new FakeProfileRepository();
    articleRepo = new FakeArticleRepository();
    commentRepo = new FakeCommentRepository();

    app = createApp({
      userRepository: userRepo,
      profileRepository: profileRepo,
      articleRepository: articleRepo,
      commentRepository: commentRepo,
    });
    authService = new AuthService(userRepo);

    user1 = await userRepo.create({
      username: 'commenter',
      email: 'commenter@example.com',
      passwordHash: 'hash',
    });

    user2 = await userRepo.create({
      username: 'other',
      email: 'other@example.com',
      passwordHash: 'hash',
    });

    token1 = authService.generateToken({
      id: user1.id,
      username: user1.username,
      email: user1.email,
    });

    token2 = authService.generateToken({
      id: user2.id,
      username: user2.username,
      email: user2.email,
    });

    await articleRepo.create({
      title: 'Comment Target Article',
      description: 'Desc',
      body: 'Body',
      authorId: user1.id,
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('creates a comment when authenticated', async () => {
      const res = await request(app)
        .post('/api/articles/comment-test-article/comments')
        .set('Authorization', `Token ${token1}`)
        .send({
          comment: {
            body: 'First comment!',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.comment).toBeDefined();
      expect(res.body.comment.body).toBe('First comment!');
      expect(res.body.comment.author.username).toBe('commenter');
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/articles/comment-test-article/comments')
        .send({
          comment: {
            body: 'Unauthorized comment',
          },
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles/comment-test-article/comments')
        .set('Authorization', `Token ${token1}`)
        .send({
          comment: {
            body: 'Sample comment',
          },
        });
    });

    it('returns array of comments for article', async () => {
      const res = await request(app).get(
        '/api/articles/comment-test-article/comments'
      );

      expect(res.status).toBe(200);
      expect(res.body.comments).toBeDefined();
      expect(res.body.comments.length).toBe(1);
      expect(res.body.comments[0].body).toBe('Sample comment');
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    let commentId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/articles/comment-test-article/comments')
        .set('Authorization', `Token ${token1}`)
        .send({
          comment: {
            body: 'Comment to delete',
          },
        });
      commentId = res.body.comment.id;
    });

    it('returns 403 when non-author attempts delete', async () => {
      const res = await request(app)
        .delete(`/api/articles/comment-test-article/comments/${commentId}`)
        .set('Authorization', `Token ${token2}`);

      expect(res.status).toBe(403);
    });

    it('deletes comment when requested by author', async () => {
      const res = await request(app)
        .delete(`/api/articles/comment-test-article/comments/${commentId}`)
        .set('Authorization', `Token ${token1}`);

      expect(res.status).toBe(200);

      const listRes = await request(app).get(
        '/api/articles/comment-test-article/comments'
      );
      expect(listRes.body.comments.length).toBe(0);
    });
  });
});
