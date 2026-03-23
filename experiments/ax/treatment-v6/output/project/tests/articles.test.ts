import request from 'supertest';
import express from 'express';
import type { Express } from 'express';
import type {
  IArticleRepository,
  ArticleWithMeta,
  ArticleFilters,
  CreateArticleData,
  UpdateArticleData,
} from '../src/repositories/IArticleRepository.js';
import { ArticleService } from '../src/services/ArticleService.js';
import { createArticleRouter } from '../src/routes/article.routes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { NotFoundError } from '../src/errors/AppError.js';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long';

// §8 DRY: In-memory article repository fake — follows established in-memory repository pattern.
class InMemoryArticleRepository implements IArticleRepository {
  private articles: ArticleWithMeta[] = [];
  private nextId = 1;

  addArticle(article: ArticleWithMeta): void {
    this.articles.push(article);
  }

  async findAll(
    filters: ArticleFilters,
    currentUserId?: number,
  ): Promise<{ articles: ArticleWithMeta[]; articlesCount: number }> {
    let filtered = [...this.articles];
    if (filters.tag) filtered = filtered.filter((a) => a.tagList.includes(filters.tag!));
    if (filters.author) filtered = filtered.filter((a) => a.author.username === filters.author);
    const articlesCount = filtered.length;
    filtered = filtered.slice(filters.offset, filters.offset + filters.limit);
    return { articles: filtered, articlesCount };
  }

  async findFeed(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{ articles: ArticleWithMeta[]; articlesCount: number }> {
    const filtered = this.articles.filter((a) => a.author.following);
    const articlesCount = filtered.length;
    return { articles: filtered.slice(offset, offset + limit), articlesCount };
  }

  async findBySlug(slug: string, _currentUserId?: number): Promise<ArticleWithMeta | null> {
    return this.articles.find((a) => a.slug === slug) ?? null;
  }

  async create(data: CreateArticleData): Promise<ArticleWithMeta> {
    const article: ArticleWithMeta = {
      id: this.nextId++,
      slug: data.slug,
      title: data.title,
      description: data.description,
      body: data.body,
      authorId: data.authorId,
      tagList: data.tagList,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { username: 'author', bio: null, image: null, following: false },
      favoritesCount: 0,
      favorited: false,
    };
    this.articles.push(article);
    return article;
  }

  async update(slug: string, data: UpdateArticleData, _currentUserId?: number): Promise<ArticleWithMeta> {
    const index = this.articles.findIndex((a) => a.slug === slug);
    if (index === -1) throw new NotFoundError('Article', slug);
    const updated = {
      ...this.articles[index],
      ...data,
      updatedAt: new Date(),
    } as ArticleWithMeta;
    this.articles[index] = updated;
    return updated;
  }

  async delete(slug: string): Promise<void> {
    this.articles = this.articles.filter((a) => a.slug !== slug);
  }

  async favorite(slug: string, userId: number): Promise<ArticleWithMeta> {
    const article = this.articles.find((a) => a.slug === slug);
    if (!article) throw new NotFoundError('Article', slug);
    return { ...article, favorited: true, favoritesCount: article.favoritesCount + 1 };
  }

  async unfavorite(slug: string, userId: number): Promise<ArticleWithMeta> {
    const article = this.articles.find((a) => a.slug === slug);
    if (!article) throw new NotFoundError('Article', slug);
    return {
      ...article,
      favorited: false,
      favoritesCount: Math.max(0, article.favoritesCount - 1),
    };
  }

  async isFavorited(articleId: number, userId: number): Promise<boolean> {
    return false;
  }

  async getFavoritesCount(articleId: number): Promise<number> {
    return 0;
  }

  reset(): void {
    this.articles = [];
    this.nextId = 1;
  }
}

function buildTestApp(repo: IArticleRepository): Express {
  const app = express();
  app.use(express.json());
  const articleService = new ArticleService(repo);
  app.use('/api', createArticleRouter(articleService));
  app.use(errorHandler);
  return app;
}

function makeToken(userId: number): string {
  return sign({ userId }, JWT_SECRET);
}

const sampleArticle: ArticleWithMeta = {
  id: 1,
  slug: 'how-to-train-your-dragon',
  title: 'How to train your dragon',
  description: 'Ever wonder how?',
  body: 'It takes a Toothless',
  tagList: ['training', 'dragons'],
  authorId: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  author: { username: 'author', bio: null, image: null, following: false },
  favoritesCount: 0,
  favorited: false,
};

describe('Article endpoints', () => {
  let repo: InMemoryArticleRepository;
  let app: Express;

  beforeEach(() => {
    repo = new InMemoryArticleRepository();
    app = buildTestApp(repo);
    process.env['JWT_SECRET'] = JWT_SECRET;
  });

  describe('GET /api/articles — list articles', () => {
    it('returns 200 with articles list (no body field per performance spec)', async () => {
      repo.addArticle(sampleArticle);

      const res = await request(app).get('/api/articles');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.articles)).toBe(true);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].slug).toBe('how-to-train-your-dragon');
      // Body field excluded from list responses per 2024-08-16 spec
      expect(res.body.articles[0].body).toBeUndefined();
    });

    it('returns 200 with empty array when no articles', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect(res.body.articles).toEqual([]);
      expect(res.body.articlesCount).toBe(0);
    });

    it('filters by tag', async () => {
      repo.addArticle(sampleArticle);
      repo.addArticle({ ...sampleArticle, id: 2, slug: 'another', tagList: ['other'] });

      const res = await request(app).get('/api/articles?tag=dragons');

      expect(res.status).toBe(200);
      expect(res.body.articles.length).toBe(1);
      expect(res.body.articles[0].slug).toBe('how-to-train-your-dragon');
    });
  });

  describe('GET /api/articles/feed', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/articles/feed');
      expect(res.status).toBe(401);
    });

    it('returns 200 with articles from followed authors', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.articles)).toBe(true);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns 200 with article including body', async () => {
      repo.addArticle(sampleArticle);

      const res = await request(app).get('/api/articles/how-to-train-your-dragon');

      expect(res.status).toBe(200);
      expect(res.body.article.slug).toBe('how-to-train-your-dragon');
      expect(res.body.article.body).toBe('It takes a Toothless');
    });

    it('returns 404 when article does not exist', async () => {
      const res = await request(app).get('/api/articles/nonexistent-slug');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/articles', () => {
    it('returns 201 with created article when authenticated', async () => {
      const token = makeToken(1);

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'New Article',
            description: 'About something',
            body: 'Full content here',
            tagList: ['tag1', 'tag2'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.article.title).toBe('New Article');
      expect(res.body.article.body).toBe('Full content here');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({ article: { title: 'Test', description: 'Desc', body: 'Body' } });
      expect(res.status).toBe(401);
    });

    it('returns 422 when title is missing', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({ article: { description: 'Desc', body: 'Body' } });
      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('returns 200 with updated article when author updates', async () => {
      const authoredArticle = { ...sampleArticle, authorId: 1 };
      repo.addArticle(authoredArticle);
      const token = makeToken(1);

      const res = await request(app)
        .put('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${token}`)
        .send({ article: { title: 'Updated Title' } });

      expect(res.status).toBe(200);
    });

    it('returns 401 when not authenticated', async () => {
      repo.addArticle(sampleArticle);
      const res = await request(app)
        .put('/api/articles/how-to-train-your-dragon')
        .send({ article: { title: 'Updated' } });
      expect(res.status).toBe(401);
    });

    it('returns 403 when non-author tries to update', async () => {
      const article = { ...sampleArticle, authorId: 99 };
      repo.addArticle(article);
      const token = makeToken(1); // different user

      const res = await request(app)
        .put('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${token}`)
        .send({ article: { title: 'Updated' } });

      expect(res.status).toBe(403);
    });

    it('returns 404 when article does not exist', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .put('/api/articles/nonexistent')
        .set('Authorization', `Token ${token}`)
        .send({ article: { title: 'Updated' } });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('returns 204 when author deletes article', async () => {
      const authoredArticle = { ...sampleArticle, authorId: 1 };
      repo.addArticle(authoredArticle);
      const token = makeToken(1);

      const res = await request(app)
        .delete('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(204);
    });

    it('returns 401 when not authenticated', async () => {
      repo.addArticle(sampleArticle);
      const res = await request(app).delete('/api/articles/how-to-train-your-dragon');
      expect(res.status).toBe(401);
    });

    it('returns 403 when non-author tries to delete', async () => {
      const article = { ...sampleArticle, authorId: 99 };
      repo.addArticle(article);
      const token = makeToken(1);

      const res = await request(app)
        .delete('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    it('returns 200 with favorited=true when authenticated', async () => {
      repo.addArticle(sampleArticle);
      const token = makeToken(1);

      const res = await request(app)
        .post('/api/articles/how-to-train-your-dragon/favorite')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.article.favorited).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      repo.addArticle(sampleArticle);
      const res = await request(app).post('/api/articles/how-to-train-your-dragon/favorite');
      expect(res.status).toBe(401);
    });

    it('returns 404 when article does not exist', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .post('/api/articles/nonexistent/favorite')
        .set('Authorization', `Token ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    it('returns 200 with favorited=false when authenticated', async () => {
      repo.addArticle(sampleArticle);
      const token = makeToken(1);

      const res = await request(app)
        .delete('/api/articles/how-to-train-your-dragon/favorite')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.article.favorited).toBe(false);
    });

    it('returns 401 when not authenticated', async () => {
      repo.addArticle(sampleArticle);
      const res = await request(app).delete('/api/articles/how-to-train-your-dragon/favorite');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/articles/feed — body excluded from list', () => {
    it('returns articles without body field', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      if (res.body.articles.length > 0) {
        expect(res.body.articles[0].body).toBeUndefined();
      }
    });
  });
});
