import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

const alice = { username: 'alice', email: 'alice@example.com', password: 'secret' };
const bob = { username: 'bob', email: 'bob@example.com', password: 'secret' };
const article = { title: 'Article', description: 'Description', body: 'Body', tagList: [] };

async function register(user: typeof alice): Promise<string> {
  return (await request(app).post('/api/users').send({ user })).body.user.token;
}

async function createArticle(token: string): Promise<string> {
  return (await request(app).post('/api/articles').set('Authorization', `Token ${token}`).send({ article })).body.article.slug;
}

beforeAll(() => { process.env.JWT_SECRET = 'integration-test-secret'; });
beforeEach(async () => {
  await prisma.comment.deleteMany(); await prisma.favorite.deleteMany(); await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany(); await prisma.tag.deleteMany(); await prisma.follow.deleteMany(); await prisma.user.deleteMany();
});
afterAll(async () => { await prisma.$disconnect(); });

describe('API error responses', () => {
  it('returns the error envelope when registration input is invalid', async () => {
    const response = await request(app).post('/api/users').send({ user: { email: 'invalid' } });
    expect(response.status).toBe(422);
    expect(response.body).toEqual({ errors: { body: ['Invalid request'] } });
  });

  it('returns 401 when updating a user without authentication', async () => {
    expect((await request(app).put('/api/user').send({ user: { bio: 'No auth' } })).status).toBe(401);
  });

  it('returns 401 when unfollowing without authentication', async () => {
    await register(bob);
    expect((await request(app).delete('/api/profiles/bob/follow')).status).toBe(401);
  });

  it('returns 404 when an article does not exist', async () => {
    expect((await request(app).get('/api/articles/missing')).status).toBe(404);
  });

  it('returns 403 when updating another authors article', async () => {
    const aliceToken = await register(alice); const bobToken = await register(bob); const slug = await createArticle(aliceToken);
    const response = await request(app).put(`/api/articles/${slug}`).set('Authorization', `Token ${bobToken}`).send({ article: { title: 'Denied' } });
    expect(response.status).toBe(403);
  });

  it('returns 422 when pagination is negative', async () => {
    const response = await request(app).get('/api/articles?limit=-1');
    expect(response.status).toBe(422);
    expect(response.body.errors.body).toHaveLength(1);
  });

  it('returns 401 when deleting a comment without authentication', async () => {
    expect((await request(app).delete('/api/articles/missing/comments/1')).status).toBe(401);
  });

  it('returns 404 when listing comments for a missing article', async () => {
    expect((await request(app).get('/api/articles/missing/comments')).status).toBe(404);
  });

  it('returns 404 when favoriting a missing article', async () => {
    const token = await register(alice);
    expect((await request(app).post('/api/articles/missing/favorite').set('Authorization', `Token ${token}`)).status).toBe(404);
  });
});
