import request from 'supertest';
import express from 'express';
import type { Express } from 'express';
import type {
  ICommentRepository,
  Comment,
  CommentWithAuthor,
  CreateCommentData,
} from '../src/repositories/ICommentRepository.js';
import { CommentService } from '../src/services/CommentService.js';
import { createCommentRouter } from '../src/routes/comment.routes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { NotFoundError } from '../src/errors/AppError.js';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long';

// §8 DRY: In-memory comment repository fake — follows established in-memory repository pattern.
class InMemoryCommentRepository implements ICommentRepository {
  private comments: CommentWithAuthor[] = [];
  private nextId = 1;

  async findByArticleSlug(articleSlug: string, _currentUserId?: number): Promise<CommentWithAuthor[]> {
    return this.comments.filter((c) => c.articleId === 1); // simplified for unit tests
  }

  async findById(id: number): Promise<Comment | null> {
    return this.comments.find((c) => c.id === id) ?? null;
  }

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const comment: CommentWithAuthor = {
      id: this.nextId++,
      body: data.body,
      authorId: data.authorId,
      articleId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { username: 'testuser', bio: null, image: null, following: false },
    };
    this.comments.push(comment);
    return comment;
  }

  async delete(id: number): Promise<void> {
    const index = this.comments.findIndex((c) => c.id === id);
    if (index !== -1) this.comments.splice(index, 1);
  }

  reset(): void {
    this.comments = [];
    this.nextId = 1;
  }
}

function buildTestApp(repo: ICommentRepository): Express {
  const app = express();
  app.use(express.json());
  const commentService = new CommentService(repo);
  app.use('/api', createCommentRouter(commentService));
  app.use(errorHandler);
  return app;
}

function makeToken(userId: number): string {
  return sign({ userId }, JWT_SECRET);
}

describe('Comment endpoints', () => {
  let repo: InMemoryCommentRepository;
  let app: Express;

  beforeEach(() => {
    repo = new InMemoryCommentRepository();
    app = buildTestApp(repo);
    process.env['JWT_SECRET'] = JWT_SECRET;
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('returns 200 with comments array', async () => {
      const res = await request(app).get('/api/articles/some-article/comments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.comments)).toBe(true);
    });

    it('returns 200 with comments including author info', async () => {
      const token = makeToken(1);
      await request(app)
        .post('/api/articles/some-article/comments')
        .set('Authorization', `Token ${token}`)
        .send({ comment: { body: 'Test comment' } });

      const res = await request(app).get('/api/articles/some-article/comments');
      expect(res.status).toBe(200);
      expect(res.body.comments[0]).toHaveProperty('author');
      expect(res.body.comments[0]).toHaveProperty('body');
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('returns 201 with created comment when authenticated', async () => {
      const token = makeToken(1);

      const res = await request(app)
        .post('/api/articles/some-article/comments')
        .set('Authorization', `Token ${token}`)
        .send({ comment: { body: 'This is a test comment' } });

      expect(res.status).toBe(201);
      expect(res.body.comment.body).toBe('This is a test comment');
      expect(res.body.comment).toHaveProperty('author');
      expect(res.body.comment).toHaveProperty('createdAt');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/articles/some-article/comments')
        .send({ comment: { body: 'Test' } });
      expect(res.status).toBe(401);
    });

    it('returns 422 when body is empty', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .post('/api/articles/some-article/comments')
        .set('Authorization', `Token ${token}`)
        .send({ comment: { body: '' } });
      expect(res.status).toBe(422);
    });

    it('returns 422 when body is missing', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .post('/api/articles/some-article/comments')
        .set('Authorization', `Token ${token}`)
        .send({ comment: {} });
      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('returns 204 when author deletes their comment', async () => {
      const token = makeToken(1);

      // Create a comment
      const createRes = await request(app)
        .post('/api/articles/some-article/comments')
        .set('Authorization', `Token ${token}`)
        .send({ comment: { body: 'Delete me' } });

      const commentId = createRes.body.comment.id;

      const res = await request(app)
        .delete(`/api/articles/some-article/comments/${commentId}`)
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(204);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/articles/some-article/comments/1');
      expect(res.status).toBe(401);
    });

    it('returns 403 when non-author tries to delete', async () => {
      // Create comment as user 1
      const token1 = makeToken(1);
      const createRes = await request(app)
        .post('/api/articles/some-article/comments')
        .set('Authorization', `Token ${token1}`)
        .send({ comment: { body: 'My comment' } });

      const commentId = createRes.body.comment.id;

      // Try to delete as user 2
      const token2 = makeToken(2);
      const res = await request(app)
        .delete(`/api/articles/some-article/comments/${commentId}`)
        .set('Authorization', `Token ${token2}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 when comment does not exist', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .delete('/api/articles/some-article/comments/9999')
        .set('Authorization', `Token ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
