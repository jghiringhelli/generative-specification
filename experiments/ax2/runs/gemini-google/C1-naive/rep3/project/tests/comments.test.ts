import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    article: {
      findUnique: jest.fn()
    },
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Comments Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('should return 404 if article not found', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/articles/nonexistent/comments');
      expect(res.status).toBe(404);
      expect(res.body.errors.article).toBeDefined();
    });

    it('should return comments array if article exists', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ id: 1, slug: 'valid-slug' });
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 10,
          body: 'Great article!',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            username: 'commenter',
            bio: '',
            image: null,
            followedBy: []
          }
        }
      ]);

      const res = await request(app).get('/api/articles/valid-slug/comments');
      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].body).toBe('Great article!');
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/articles/valid-slug/comments')
        .send({ comment: { body: 'Hello' } });
      expect(res.status).toBe(401);
    });
  });
});
