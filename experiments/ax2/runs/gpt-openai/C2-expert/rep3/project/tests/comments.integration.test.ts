import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

const alice = { username: 'alice', email: 'alice@example.com', password: 'secret' };
const bob = { username: 'bob', email: 'bob@example.com', password: 'secret' };

async function register(user: typeof alice): Promise<string> {
  return (await request(app).post('/api/users').send({ user })).body.user.token;
}

async function createArticle(token: string): Promise<string> {
  const article = { title: 'Article', description: 'Description', body: 'Body', tagList: [] };
  return (await request(app).post('/api/articles').set('Authorization', `Token ${token}`).send({ article })).body.article.slug;
}

async function addComment(token: string, slug: string): Promise<number> {
  const response = await request(app).post(`/api/articles/${slug}/comments`).set('Authorization', `Token ${token}`).send({ comment: { body: 'Nice article' } });
  return response.body.comment.id;
}

beforeAll(() => { process.env.JWT_SECRET = 'integration-test-secret'; });
beforeEach(async () => {
  await prisma.comment.deleteMany(); await prisma.favorite.deleteMany(); await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany(); await prisma.tag.deleteMany(); await prisma.follow.deleteMany(); await prisma.user.deleteMany();
});
afterAll(async () => { await prisma.$disconnect(); });

describe('comment endpoints', () => {
  it('lists comments without authentication', async () => {
    const token = await register(alice); const slug = await createArticle(token); await addComment(token, slug);
    const response = await request(app).get(`/api/articles/${slug}/comments`);
    expect(response.status).toBe(200);
    expect(response.body.comments[0].author.username).toBe('alice');
  });

  it('adds a comment to an article', async () => {
    const token = await register(alice); const slug = await createArticle(token);
    const response = await request(app).post(`/api/articles/${slug}/comments`).set('Authorization', `Token ${token}`).send({ comment: { body: 'Great' } });
    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe('Great');
  });

  it('deletes a comment owned by the authenticated user', async () => {
    const token = await register(alice); const slug = await createArticle(token); const id = await addComment(token, slug);
    const response = await request(app).delete(`/api/articles/${slug}/comments/${id}`).set('Authorization', `Token ${token}`);
    expect(response.status).toBe(204);
  });

  it('returns 403 when deleting another users comment', async () => {
    const aliceToken = await register(alice); const bobToken = await register(bob);
    const slug = await createArticle(aliceToken); const id = await addComment(aliceToken, slug);
    const response = await request(app).delete(`/api/articles/${slug}/comments/${id}`).set('Authorization', `Token ${bobToken}`);
    expect(response.status).toBe(403);
  });

  it('returns 401 when adding a comment without authentication', async () => {
    const token = await register(alice); const slug = await createArticle(token);
    const response = await request(app).post(`/api/articles/${slug}/comments`).send({ comment: { body: 'No auth' } });
    expect(response.status).toBe(401);
  });

  it('returns 404 when commenting on a non-existent article', async () => {
    const token = await register(alice);
    const response = await request(app).post('/api/articles/missing/comments').set('Authorization', `Token ${token}`).send({ comment: { body: 'Missing' } });
    expect(response.status).toBe(404);
  });
});
