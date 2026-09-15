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
import { AuthService } from '../../src/services/AuthService';

class FakeUserRepository implements IUserRepository {
  private users: UserEntity[] = [];

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
      bio: data.bio ?? '',
      image: data.image ?? '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new Error('Not found');
    Object.assign(user, data);
    return user;
  }
}

class FakeProfileRepository implements IProfileRepository {
  private follows = new Set<string>();

  async findByUsername(_username: string): Promise<ProfileEntity | null> {
    return null;
  }
  async follow(followerId: string, followingId: string): Promise<void> {
    this.follows.add(`${followerId}:${followingId}`);
  }
  async unfollow(followerId: string, followingId: string): Promise<void> {
    this.follows.delete(`${followerId}:${followingId}`);
  }
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.follows.has(`${followerId}:${followingId}`);
  }
}

class FakeArticleRepository implements IArticleRepository {
  private articles: ArticleEntity[] = [];
  private favorites = new Set<string>();

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    return this.articles.find((a) => a.slug === slug) ?? null;
  }

  async list(
    options: ArticleQueryOptions
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    let result = [...this.articles];
    if (options.tag) {
      result = result.filter((a) => a.tagList.includes(options.tag!));
    }
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    return {
      articles: result.slice(offset, offset + limit),
      articlesCount: result.length,
    };
  }

  async listFeed(
    _userId: string,
    options: ArticleFeedOptions
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    return {
      articles: this.articles.slice(offset, offset + limit),
      articlesCount: this.articles.length,
    };
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const article: ArticleEntity = {
      id: `article-${Date.now()}-${Math.random()}`,
      slug: data.title.toLowerCase().replace(/\s+/g, '-'),
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

  async update(slug: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    if (!article) throw new Error('Not found');
    if (data.title) {
      article.title = data.title;
      article.slug = data.title.toLowerCase().replace(/\s+/g, '-');
    }
    if (data.description) article.description = data.description;
    if (data.body) article.body = data.body;
    article.updatedAt = new Date();
    return article;
  }

  async delete(slug: string): Promise<void> {
    this.articles = this.articles.filter((a) => a.slug !== slug);
  }

  async favorite(articleId: string, userId: string): Promise<void> {
    this.favorites.add(`${articleId}:${userId}`);
  }

  async unfavorite(articleId: string, userId: string): Promise<void> {
    this.favorites.delete(`${articleId}:${userId}`);
  }

  async isFavorited(articleId: string, userId: string): Promise<boolean> {
    return this.favorites.has(`${articleId}:${userId}`);
  }

  async getFavoritesCount(articleId: string): Promise<number> {
    let count = 0;
    for (const key of this.favorites) {
      if (key.startsWith(`${articleId}:`)) count++;
    }
    return count;
  }
}

describe('Article Endpoints (Integration)', () => {
  let userRepo: FakeUserRepository;
  let profileRepo: FakeProfileRepository;
  let articleRepo: FakeArticleRepository;
  let app: any;
  let authService: AuthService;
  let author: UserEntity;
  let otherUser: UserEntity;
  let authorToken: string;
  let otherToken: string;

  beforeEach(async () => {
    userRepo = new FakeUserRepository();
    profileRepo = new FakeProfileRepository();
    articleRepo = new FakeArticleRepository();
    app = createApp({
      userRepository: userRepo,
      profileRepository: profileRepo,
      articleRepository: articleRepo,
    });
    authService = new AuthService(userRepo);

    author = await userRepo.create({
      username: 'jake',
      email: 'jake@example.com',
      passwordHash: 'hash',
    });

    otherUser = await userRepo.create({
      username: 'other',
      email: 'other@example.com',
      passwordHash: 'hash',
    });

    authorToken = authService.generateToken({
      id: author.id,
      username: author.username,
      email: author.email,
    });

    otherToken = authService.generateToken({
      id: otherUser.id,
      username: otherUser.username,
      email: otherUser.email,
    });
  });

  describe('POST /api/articles', () => {
    it('creates an article when authenticated', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'It takes a Jacobian',
            tagList: ['dragons', 'training'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.article).toBeDefined();
      expect(res.body.article.slug).toBe('how-to-train-your-dragon');
      expect(res.body.article.body).toBe('It takes a Jacobian');
      expect(res.body.article.author.username).toBe('jake');
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/articles').send({
        article: {
          title: 'Title',
          description: 'Desc',
          body: 'Body',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/articles & GET /api/articles/feed', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Sample Article',
            description: 'Sample description',
            body: 'Sample body text',
            tagList: ['test'],
          },
        });
    });

    it('omits body field in list responses', async () => {
      const res = await request(app).get('/api/articles');

      expect(res.status).toBe(200);
      expect(res.body.articles).toBeDefined();
      expect(res.body.articles.length).toBe(1);
      expect(res.body.articles[0].body).toBeUndefined();
      expect(res.body.articles[0].title).toBe('Sample Article');
    });

    it('returns feed articles for authenticated user without body field', async () => {
      const res = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.articles).toBeDefined();
      expect(res.body.articles[0].body).toBeUndefined();
    });

    it('returns 401 for feed when unauthenticated', async () => {
      const res = await request(app).get('/api/articles/feed');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/articles/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Specific Article',
            description: 'Specific description',
            body: 'Specific body text',
          },
        });
    });

    it('returns the article including body', async () => {
      const res = await request(app).get('/api/articles/specific-article');

      expect(res.status).toBe(200);
      expect(res.body.article.slug).toBe('specific-article');
      expect(res.body.article.body).toBe('Specific body text');
    });

    it('returns 404 for nonexistent slug', async () => {
      const res = await request(app).get('/api/articles/nonexistent-article');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Editable Article',
            description: 'Editable description',
            body: 'Editable body',
          },
        });
    });

    it('updates article when requested by author', async () => {
      const res = await request(app)
        .put('/api/articles/editable-article')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            description: 'Updated description',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.article.description).toBe('Updated description');
    });

    it('returns 403 when user is not author', async () => {
      const res = await request(app)
        .put('/api/articles/editable-article')
        .set('Authorization', `Token ${otherToken}`)
        .send({
          article: {
            description: 'Malicious update',
          },
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Delete Me',
            description: 'Desc',
            body: 'Body',
          },
        });
    });

    it('returns 403 when non-author attempts delete', async () => {
      const res = await request(app)
        .delete('/api/articles/delete-me')
        .set('Authorization', `Token ${otherToken}`);

      expect(res.status).toBe(403);
    });

    it('deletes article when requested by author', async () => {
      const res = await request(app)
        .delete('/api/articles/delete-me')
        .set('Authorization', `Token ${authorToken}`);

      expect(res.status).toBe(200);

      const check = await request(app).get('/api/articles/delete-me');
      expect(check.status).toBe(404);
    });
  });

  describe('POST & DELETE /api/articles/:slug/favorite', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Favorite Target',
            description: 'Desc',
            body: 'Body',
          },
        });
    });

    it('favorites and unfavorites an article', async () => {
      const favRes = await request(app)
        .post('/api/articles/favorite-target/favorite')
        .set('Authorization', `Token ${otherToken}`);

      expect(favRes.status).toBe(200);
      expect(favRes.body.article.favorited).toBe(true);
      expect(favRes.body.article.favoritesCount).toBe(1);

      const unfavRes = await request(app)
        .delete('/api/articles/favorite-target/favorite')
        .set('Authorization', `Token ${otherToken}`);

      expect(unfavRes.status).toBe(200);
      expect(unfavRes.body.article.favorited).toBe(false);
      expect(unfavRes.body.article.favoritesCount).toBe(0);
    });
  });
});
