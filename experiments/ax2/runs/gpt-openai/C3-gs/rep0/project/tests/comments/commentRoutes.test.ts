import express from 'express';
import request from 'supertest';
import { AuthService } from '../../src/auth/AuthService';
import { CommentService, CommentView } from '../../src/comments/CommentService';
import { createCommentRouter } from '../../src/comments/commentRoutes';
import { errorHandler } from '../../src/http/errorHandler';
import { IUserRepository, UserRecord } from '../../src/repositories/IUserRepository';

const comment: CommentView = {
  id: 'comment-id', body: 'Good article', createdAt: new Date(), updatedAt: new Date(),
  author: { username: 'alice', bio: null, image: null, following: false },
};

describe('comment endpoints', () => {
  const service = {
    list: jest.fn(), create: jest.fn(), delete: jest.fn(),
  } as unknown as jest.Mocked<CommentService>;
  const user: UserRecord = {
    id: 'user-id', email: 'alice@example.com', username: 'alice',
    passwordHash: 'hash', bio: null, image: null,
  };
  const users = {
    findById: jest.fn(), findByEmail: jest.fn(), findByUsername: jest.fn(),
    create: jest.fn(), update: jest.fn(),
  } as jest.Mocked<IUserRepository>;
  const auth = new AuthService(users, 'a-secret-with-at-least-thirty-two-characters');
  const app = express().use(express.json())
    .use('/api/articles', createCommentRouter(service, auth)).use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    service.list.mockResolvedValue([comment]);
    service.create.mockResolvedValue(comment);
    users.create.mockResolvedValue(user);
  });

  async function token(): Promise<string> {
    return (await auth.register({
      email: user.email, username: user.username, password: 'password123',
    })).token;
  }

  test('GET /api/articles/:slug/comments lists comments', async () => {
    await request(app).get('/api/articles/hello/comments').expect(200)
      .expect(({ body }) => expect(body.comments).toHaveLength(1));
  });

  test('POST /api/articles/:slug/comments creates a comment', async () => {
    await request(app).post('/api/articles/hello/comments')
      .set('Authorization', `Token ${await token()}`)
      .send({ comment: { body: 'Good article' } }).expect(201);
  });

  test('DELETE /api/articles/:slug/comments/:id deletes an authored comment', async () => {
    await request(app).delete('/api/articles/hello/comments/comment-id')
      .set('Authorization', `Token ${await token()}`).expect(204);
  });

  test('comment writes require authentication', async () => {
    await request(app).post('/api/articles/hello/comments')
      .send({ comment: { body: 'No token' } }).expect(401);
  });
});
