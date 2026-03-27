import request from 'supertest';
import { createApp } from '../app';
import { InMemoryUserRepository } from '../repositories/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../repositories/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../repositories/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../repositories/InMemoryCommentRepository';
import { InMemoryTagRepository } from '../repositories/InMemoryTagRepository';
import { UserService } from '../services/UserService';
import { ProfileService } from '../services/ProfileService';
import { ArticleService } from '../services/ArticleService';
import { CommentService } from '../services/CommentService';
import { TagService } from '../services/TagService';

// Shared user store — all repos that need user lookups reference this instance.
const userRepo = new InMemoryUserRepository();
const profileRepo = new InMemoryProfileRepository(userRepo);
const articleRepo = new InMemoryArticleRepository(userRepo);
const commentRepo = new InMemoryCommentRepository(userRepo);
const tagRepo = new InMemoryTagRepository(articleRepo);

const userService = new UserService(userRepo);
const profileService = new ProfileService(profileRepo);
const articleService = new ArticleService(articleRepo);
const commentService = new CommentService(commentRepo, articleRepo);
const tagService = new TagService(tagRepo);
const app = createApp({ userService, profileService, articleService, commentService, tagService });

const ALICE = { email: 'alice@example.com', username: 'alice', password: 'Password123!' };
const BOB = { email: 'bob@example.com', username: 'bob', password: 'Password123!' };

const ARTICLE_PAYLOAD = {
  title: 'Test Article',
  description: 'A test article',
  body: 'Article body content',
  tagList: [],
};

/** Register a user and return their JWT token. */
async function registerAndGetToken(user: typeof ALICE): Promise<string> {
  const res = await request(app).post('/api/users').send({ user });
  return res.body.user.token as string;
}

/** Create an article and return its slug. */
async function createArticle(token: string): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article: ARTICLE_PAYLOAD });
  return res.body.article.slug as string;
}

/** Add a comment and return its id. */
async function addComment(token: string, slug: string, body = 'A test comment'): Promise<number> {
  const res = await request(app)
    .post(`/api/articles/${slug}/comments`)
    .set('Authorization', `Token ${token}`)
    .send({ comment: { body } });
  return res.body.comment.id as number;
}

beforeEach(() => {
  userRepo.clear();
  profileRepo.clear();
  articleRepo.clear();
  commentRepo.clear();
});

// =============================================================================
// GET /api/articles/:slug/comments
// =============================================================================
describe('GET /api/articles/:slug/comments', () => {
  it('returns 200 with empty comments array when article has no comments', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments).toEqual([]);
  });

  it('returns 200 with correct comment shape', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);
    await addComment(token, slug, 'Hello world');

    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);

    const comment = res.body.comments[0];
    expect(comment).toHaveProperty('id');
    expect(comment).toHaveProperty('body', 'Hello world');
    expect(comment).toHaveProperty('createdAt');
    expect(comment).toHaveProperty('updatedAt');
    expect(comment).toHaveProperty('author');
    expect(comment.author).toHaveProperty('username', 'alice');
    expect(comment.author).toHaveProperty('bio');
    expect(comment.author).toHaveProperty('image');
    expect(comment.author).toHaveProperty('following');
  });

  it('returns 404 when article does not exist', async () => {
    const res = await request(app).get('/api/articles/no-such-article/comments');
    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('article');
  });

  it('returns comments without auth (auth optional)', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);
    await addComment(token, slug, 'Public comment');

    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
  });

  it('returns multiple comments ordered by creation date descending', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);
    await addComment(token, slug, 'First comment');
    await addComment(token, slug, 'Second comment');
    await addComment(token, slug, 'Third comment');

    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(3);
    // Most recent first
    const dates = res.body.comments.map((c: { createdAt: string }) => new Date(c.createdAt).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    expect(dates[1]).toBeGreaterThanOrEqual(dates[2]);
  });
});

// =============================================================================
// POST /api/articles/:slug/comments
// =============================================================================
describe('POST /api/articles/:slug/comments', () => {
  it('returns 201 with comment on success', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'Great article!' } });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('comment');
    expect(res.body.comment).toHaveProperty('id');
    expect(res.body.comment).toHaveProperty('body', 'Great article!');
    expect(res.body.comment).toHaveProperty('author');
    expect(res.body.comment.author.username).toBe('alice');
  });

  it('returns 401 when not authenticated', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: 'Hello' } });

    expect(res.status).toBe(401);
  });

  it('returns 422 when body is missing', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: {} });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('body');
  });

  it('returns 422 when body is blank', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: '' } });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('body');
  });

  it('returns 404 when article does not exist', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .post('/api/articles/no-such-article/comments')
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'Hello' } });

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('article');
  });
});

// =============================================================================
// DELETE /api/articles/:slug/comments/:id
// =============================================================================
describe('DELETE /api/articles/:slug/comments/:id', () => {
  it('returns 204 when author deletes their own comment', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);
    const commentId = await addComment(token, slug);

    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(204);
  });

  it('comment is no longer listed after deletion', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);
    const commentId = await addComment(token, slug);

    await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${token}`);

    const listRes = await request(app).get(`/api/articles/${slug}/comments`);
    expect(listRes.body.comments).toHaveLength(0);
  });

  it('returns 401 when not authenticated', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);
    const commentId = await addComment(token, slug);

    const res = await request(app).delete(`/api/articles/${slug}/comments/${commentId}`);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not the comment author', async () => {
    const aliceToken = await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);
    const slug = await createArticle(aliceToken);
    const commentId = await addComment(aliceToken, slug);

    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toHaveProperty('comment');
  });

  it('returns 404 when comment does not exist', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/99999`)
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('comment');
  });

  it('returns 404 when article does not exist', async () => {
    const token = await registerAndGetToken(ALICE);

    const res = await request(app)
      .delete('/api/articles/no-such-article/comments/1')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('article');
  });

  it('returns 404 when comment id is non-numeric', async () => {
    const token = await registerAndGetToken(ALICE);
    const slug = await createArticle(token);

    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/not-a-number`)
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('comment');
  });
});
