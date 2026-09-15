import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/utils/jwt';

jest.mock('../src/prisma', () => ({
  prisma: {
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

describe('Comment Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = generateToken({ id: 1, email: 'user@example.com', username: 'commenter' });

  const mockComment = {
    id: 100,
    body: 'Nice article!',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    articleId: 10,
    authorId: 1,
    author: {
      id: 1,
      username: 'commenter',
      bio: '',
      image: '',
      followedBy: []
    }
  };

  describe('GET /api/articles/:slug/comments', () => {
    it('should return comments for article', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ id: 10, slug: 'slug-1' });
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([mockComment]);

      const res = await request(app).get('/api/articles/slug-1/comments');
      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].body).toBe('Nice article!');
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should add comment when authenticated', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ id: 10, slug: 'slug-1' });
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const res = await request(app)
        .post('/api/articles/slug-1/comments')
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: 'Nice article!'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.comment.body).toBe('Nice article!');
      expect(res.body.comment.author.username).toBe('commenter');
    });

    it('should reject comment without body', async () => {
      const res = await request(app)
        .post('/api/articles/slug-1/comments')
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: ''
          }
        });

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('should delete comment by author', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ id: 10, slug: 'slug-1' });
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue({
        id: 100,
        authorId: 1
      });
      (prisma.comment.delete as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .delete('/api/articles/slug-1/comments/100')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
