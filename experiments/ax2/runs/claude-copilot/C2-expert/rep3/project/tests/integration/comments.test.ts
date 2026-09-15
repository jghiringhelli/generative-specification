import request from 'supertest';
import { createApp } from '../../src/app';
import { resetDatabase, disconnect, createUser, TestUser } from '../helpers';

const app = createApp();

async function createArticleSlug(token: string): Promise<string> {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({
      article: { title: 'Commentable', description: 'd', body: 'b' },
    });
  return response.body.article.slug as string;
}

describe('comment endpoints', () => {
  let author: TestUser;
  let commenter: TestUser;
  let slug: string;

  beforeEach(async () => {
    await resetDatabase();
    author = await createUser(app, { username: 'author' });
    commenter = await createUser(app, { username: 'commenter' });
    slug = await createArticleSlug(author.token);
  });

  afterAll(async () => {
    await disconnect();
  });

  it('lists comments for an unauthenticated viewer', async () => {
    const response = await request(app).get(`/api/articles/${slug}/comments`);
    expect(response.status).toBe(200);
    expect(response.body.comments).toEqual([]);
  });

  it('adds a comment and returns it with its author', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${commenter.token}`)
      .send({ comment: { body: 'Nice article' } });
    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe('Nice article');
    expect(response.body.comment.author.username).toBe('commenter');
  });

  it('returns 401 when adding a comment without authentication', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: 'no auth' } });
    expect(response.status).toBe(401);
  });

  it('returns 404 when commenting on a non-existent article', async () => {
    const response = await request(app)
      .post('/api/articles/missing/comments')
      .set('Authorization', `Token ${commenter.token}`)
      .send({ comment: { body: 'ghost' } });
    expect(response.status).toBe(404);
  });

  it('deletes a comment authored by the current user', async () => {
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${commenter.token}`)
      .send({ comment: { body: 'delete me' } });
    const commentId = created.body.comment.id;
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${commenter.token}`);
    expect(response.status).toBe(200);
  });

  it("returns 403 when deleting another user's comment", async () => {
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${commenter.token}`)
      .send({ comment: { body: 'not yours' } });
    const commentId = created.body.comment.id;
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${author.token}`);
    expect(response.status).toBe(403);
  });
});
