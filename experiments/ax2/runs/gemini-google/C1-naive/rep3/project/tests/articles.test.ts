import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    follows: {
      findMany: jest.fn()
    },
    tag: {
      upsert: jest.fn()
    },
    articleTag: {
      deleteMany: jest.fn()
    },
    articleFavorite: {
      upsert: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Articles Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles', () => {
    it('should return empty list when no articles exist', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.article.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect(res.body.articles).toEqual([]);
      expect(res.body.articlesCount).toBe(0);
    });

    it('should return formatted articles', async () => {
      const mockArticle = {
        id: 1,
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test Body',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          username: 'author1',
          bio: 'Bio',
          image: null,
          followedBy: []
        },
        tags: [{ tag: { name: 'tag1' } }],
        favoritedBy: [],
        _count: { favoritedBy: 0 }
      };

      (prisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle]);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].title).toBe('Test Article');
      expect(res.body.articles[0].tagList).toEqual(['tag1']);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('should return 404 if article not found', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/articles/nonexistent-slug');
      expect(res.status).toBe(404);
      expect(res.body.errors.article).toBeDefined();
    });
  });

  describe('POST /api/articles', () => {
    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Sample',
            description: 'Sample',
            body: 'Sample'
          }
        });

      expect(res.status).toBe(401);
    });
  });
});
