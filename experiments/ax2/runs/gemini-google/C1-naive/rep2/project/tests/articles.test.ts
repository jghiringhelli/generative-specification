import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/utils/jwt';

jest.mock('../src/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    article: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    favorite: {
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Articles Endpoints', () => {
  const currentUser = { id: 1, username: 'jake', email: 'jake@example.com' };
  const token = generateToken(currentUser);

  const mockArticle = {
    id: 1,
    slug: 'test-article-123',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    authorId: 1,
    author: {
      username: 'jake',
      bio: null,
      image: null,
      followedBy: [],
    },
    tags: [{ id: 1, name: 'dragons' }],
    favorites: [],
    _count: { favorites: 0 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles', () => {
    it('should list articles with count', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle]);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/articles');

      expect(res.status).toBe(200);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articles[0].slug).toBe('test-article-123');
      expect(res.body.articles[0].tagList).toEqual(['dragons']);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('should return article by slug', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      const res = await request(app).get('/api/articles/test-article-123');

      expect(res.status).toBe(200);
      expect(res.body.article.title).toBe('Test Article');
    });

    it('should return 404 for missing article', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/articles/missing-slug');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/articles', () => {
    it('should create an article when authenticated', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(currentUser);
      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body',
            tagList: ['dragons'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.article.title).toBe('Test Article');
    });

    it('should return 422 if required fields are missing', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(currentUser);

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article',
          },
        });

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('should delete article if author', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(currentUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.article.delete as jest.Mock).mockResolvedValue(mockArticle);

      const res = await request(app)
        .delete('/api/articles/test-article-123')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 if not author', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(currentUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({
        ...mockArticle,
        authorId: 999,
      });

      const res = await request(app)
        .delete('/api/articles/test-article-123')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
