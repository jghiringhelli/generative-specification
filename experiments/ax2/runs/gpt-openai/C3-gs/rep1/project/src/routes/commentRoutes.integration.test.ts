import request from 'supertest';
import type { IPasswordHasher } from '../auth/IPasswordHasher';
import type { ITokenService } from '../auth/ITokenService';
import { createApp } from '../app';
import { AuthController } from '../controllers/AuthController';
import { CommentController } from '../controllers/CommentController';
import type { ArticleFilters, ArticleListResult, ArticleRecord, CreateArticleRecord, IArticleRepository, UpdateArticleRecord } from '../repositories/IArticleRepository';
import type { CommentRecord, CreateCommentRecord, ICommentRepository } from '../repositories/ICommentRepository';
import type { CreateUserRecord, IUserRepository, UpdateUserRecord, UserRecord } from '../repositories/IUserRepository';
import { AuthService } from '../services/AuthService';
import { CommentService } from '../services/CommentService';

const now = new Date('2026-01-01T00:00:00.000Z');
const article: ArticleRecord = { id: 'article-1', slug: 'post', title: 'Post', description: 'Description', body: 'Body', authorId: 'article-author', author: { username: 'alice', bio: null, image: null, following: false }, tagList: [], favorited: false, favoritesCount: 0, createdAt: now, updatedAt: now };
class Articles implements IArticleRepository {
  public findBySlug(slug: string) { return Promise.resolve(slug === 'post' ? article : null); }
  public list(_filters: ArticleFilters): Promise<ArticleListResult> { return Promise.resolve({ articles: [article], count: 1 }); }
  public feed() { return Promise.resolve({ articles: [article], count: 1 }); }
  public create(_data: CreateArticleRecord) { return Promise.resolve(article); }
  public update(_id: string, _data: UpdateArticleRecord) { return Promise.resolve(article); }
  public delete() { return Promise.resolve(); }
  public favorite() { return Promise.resolve(); }
  public unfavorite() { return Promise.resolve(); }
}
class Comments implements ICommentRepository {
  public records: CommentRecord[] = [];
  public findById(id: string) { return Promise.resolve(this.records.find((comment) => comment.id === id) ?? null); }
  public listByArticleId(articleId: string) { return Promise.resolve(this.records.filter((comment) => comment.articleId === articleId)); }
  public create(data: CreateCommentRecord) {
    const comment: CommentRecord = { ...data, id: 'comment-1', createdAt: now, updatedAt: now, author: { username: data.authorId, bio: null, image: null, following: false } };
    this.records.push(comment); return Promise.resolve(comment);
  }
  public delete(id: string) { this.records = this.records.filter((comment) => comment.id !== id); return Promise.resolve(); }
}
class Users implements IUserRepository {
  public findById() { return Promise.resolve(null); }
  public findByEmail() { return Promise.resolve(null); }
  public findByUsername() { return Promise.resolve(null); }
  public create(data: CreateUserRecord): Promise<UserRecord> { return Promise.resolve({ ...data, id: 'user', bio: null, image: null }); }
  public update(_id: string, data: UpdateUserRecord): Promise<UserRecord> { return Promise.resolve({ id: 'user', email: 'a@b.com', username: 'a', passwordHash: 'x', bio: null, image: null, ...data }); }
}
function setup() {
  const comments = new Comments();
  const tokens: ITokenService = { sign: ({ userId }) => userId, verify: (token) => ({ userId: token }) };
  const hasher: IPasswordHasher = { hash: async (value) => value, verify: async () => true };
  const auth = new AuthController(new AuthService(new Users(), hasher, tokens));
  const controller = new CommentController(new CommentService(comments, new Articles()));
  return { app: createApp({ authController: auth, commentController: controller, tokenService: tokens }), comments };
}

describe('comment endpoints', () => {
  test('POST creates and GET lists comments', async () => {
    const { app } = setup();
    const created = await request(app).post('/api/articles/post/comments').set('Authorization', 'Token author').send({ comment: { body: 'Great post' } });
    expect(created.status).toBe(201);
    const listed = await request(app).get('/api/articles/post/comments');
    expect(listed.body.comments).toHaveLength(1);
  });

  test('DELETE requires the comment author', async () => {
    const { app } = setup();
    await request(app).post('/api/articles/post/comments').set('Authorization', 'Token author').send({ comment: { body: 'Great post' } });
    expect((await request(app).delete('/api/articles/post/comments/comment-1').set('Authorization', 'Token stranger')).status).toBe(403);
    expect((await request(app).delete('/api/articles/post/comments/comment-1').set('Authorization', 'Token author')).status).toBe(204);
  });

  test('POST requires authentication', async () => {
    const { app } = setup();
    expect((await request(app).post('/api/articles/post/comments').send({ comment: { body: 'No token' } })).status).toBe(401);
  });
});
