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
      findUnique: jest.fn(),
    },
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Comments Endpoints', () => {
  const currentUser = { id: 1, username: 'jake', email: 'jake@example.com' };
  const token = generateToken(currentUser);

  const mockArticle = {
    id: 10,
    slug: 'dragon-article',
    title: 'Dragon Article',
  };

  const mockComment = {
    id: 1,
    body: 'Great article!',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    authorId: 1,
    articleId: 10,
    author: {
      username: 'jake',
      bio: null,
      image: null,
      followedBy: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('should return comments for an article', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([mockComment]);

      const res = await request(app).get('/api/articles/dragon-article/comments');

      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].body).toBe('Great article!');
    });

    it('should return 404 if article not found', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/articles/nonexistent/comments');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should add comment when authenticated', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(currentUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const res = await request(app)
        .post('/api/articles/dragon-article/comments')
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: 'Great article!',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.comment.body).toBe('Great article!');
    });

    it('should return 422 if comment body is empty', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(currentUser);

      const res = await request(app)
        .post('/api/articles/dragon-article/comments')
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: '',
          },
        });

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('should delete comment if author', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(currentUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
      (prisma.comment.delete as jest.Mock).mockResolvedValue(mockComment);

      const res = await request(app)
        .delete('/api/articles/dragon-article/comments/1')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 if not author', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(currentUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue({
        ...mockComment,
        authorId: 999,
      });

      const res = await request(app)
        .delete('/api/articles/dragon-article/comments/1')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
