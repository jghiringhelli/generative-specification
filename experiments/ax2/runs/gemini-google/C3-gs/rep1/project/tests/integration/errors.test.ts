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
import { ITagRepository } from '../../src/repositories/ITagRepository';
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
  async list(_options: ArticleQueryOptions) {
    return { articles: this.articles, articlesCount: this.articles.length };
  }
  async listFeed(_userId: string, _options: ArticleFeedOptions) {
    return { articles: this.articles, articlesCount: this.articles.length };
  }
  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const article: ArticleEntity = {
      id: 'article-1',
      slug: 'test-slug',
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
  async findById(_id: string): Promise<CommentEntity | null> {
    return null;
  }
  async findByArticleSlug(_slug: string): Promise<CommentEntity[]> {
    return [];
  }
  async create(data: CreateCommentData): Promise<CommentEntity> {
    return {
      id: 'comment-1',
      body: data.body,
      authorId: data.authorId,
      articleId: data.articleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  async delete(_id: string): Promise<void> {}
}

class FakeTagRepository implements ITagRepository {
  async findAll(): Promise<string[]> {
    return [];
  }
}

describe('Error Handling and Edge Cases (Integration)', () => {
  let app: any;
  let userRepo: FakeUserRepository;
  let articleRepo: FakeArticleRepository;
  let authService: AuthService;
  let validUser: UserEntity;
  let validToken: string;

  beforeEach(async () => {
    userRepo = new FakeUserRepository();
    articleRepo = new FakeArticleRepository();
    app = createApp({
      userRepository: userRepo,
      profileRepository: new FakeProfileRepository(),
      articleRepository: articleRepo,
      commentRepository: new FakeCommentRepository(),
      tagRepository: new FakeTagRepository(),
    });
    authService = new AuthService(userRepo);

    validUser = await userRepo.create({
      username: 'user1',
      email: 'user1@example.com',
      passwordHash: 'hash',
    });

    validToken = authService.generateToken({
      id: validUser.id,
      username: validUser.username,
      email: validUser.email,
    });
  });

  describe('401 Unauthorized Paths', () => {
    it('rejects GET /api/user with 401 and spec error body', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors.body)).toBe(true);
    });

    it('rejects PUT /api/user with 401 when token missing', async () => {
      const res = await request(app).put('/api/user').send({ user: { bio: 'hi' } });
      expect(res.status).toBe(401);
      expect(res.body.errors).toBeDefined();
    });

    it('rejects POST /api/articles with 401 when token invalid', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', 'Token invalid-token')
        .send({
          article: { title: 'T', description: 'D', body: 'B' },
        });
      expect(res.status).toBe(401);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('404 NotFound Paths', () => {
    it('returns 404 for non-existent profile', async () => {
      const res = await request(app).get('/api/profiles/ghost');
      expect(res.status).toBe(404);
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors.body)).toBe(true);
    });

    it('returns 404 for non-existent article slug', async () => {
      const res = await request(app).get('/api/articles/non-existent-article');
      expect(res.status).toBe(404);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('422 Unprocessable Entity Paths', () => {
    it('returns 422 for malformed user registration', async () => {
      const res = await request(app).post('/api/users').send({
        user: {
          username: '',
          email: 'not-an-email',
          password: '123',
        },
      });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 422 for missing article fields on create', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${validToken}`)
        .send({
          article: {
            title: '',
          },
        });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });
  });
});
