import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/utils/jwt';

jest.mock('../src/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    follow: {
      findMany: jest.fn()
    },
    favorite: {
      upsert: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Article Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = generateToken({ id: 1, email: 'author@example.com', username: 'author' });

  const mockArticle = {
    id: 10,
    slug: 'test-article-abc123',
    title: 'Test Article',
    description: 'A test description',
    body: 'A test body',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    authorId: 1,
    author: {
      id: 1,
      username: 'author',
      bio: 'Author bio',
      image: '',
      followedBy: []
    },
    tags: [{ name: 'testing' }],
    favorites: [],
    _count: { favorites: 0 }
  };

  describe('GET /api/articles', () => {
    it('should return list of articles', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle]);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].slug).toBe('test-article-abc123');
      expect(res.body.articles[0].tagList).toEqual(['testing']);
    });
  });

  describe('POST /api/articles', () => {
    it('should create an article when authenticated', async () => {
      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'A test description',
            body: 'A test body',
            tagList: ['testing']
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.article).toBeDefined();
      expect(res.body.article.title).toBe('Test Article');
    });

    it('should require title, description, and body', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: ''
          }
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.title).toBeDefined();
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('should return article by slug', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      const res = await request(app).get('/api/articles/test-article-abc123');
      expect(res.status).toBe(200);
      expect(res.body.article.slug).toBe('test-article-abc123');
    });

    it('should return 404 for non-existent slug', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/articles/unknown-slug');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    it('should favorite an article', async () => {
      (prisma.article.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 10, slug: 'test-article-abc123' })
        .mockResolvedValueOnce({
          ...mockArticle,
          favorites: [{ userId: 1 }],
          _count: { favorites: 1 }
        });
      (prisma.favorite.upsert as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/articles/test-article-abc123/favorite')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.article.favorited).toBe(true);
      expect(res.body.article.favoritesCount).toBe(1);
    });
  });
});
