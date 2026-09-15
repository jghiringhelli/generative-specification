import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

const user = { username: 'alice', email: 'alice@example.com', password: 'secret' };

async function token(): Promise<string> {
  return (await request(app).post('/api/users').send({ user })).body.user.token;
}

async function createArticle(authToken: string, title: string, tagList: string[]): Promise<string> {
  const response = await request(app).post('/api/articles').set('Authorization', `Token ${authToken}`).send({
    article: { title, description: 'Description', body: 'Body', tagList },
  });
  return response.body.article.slug;
}

beforeAll(() => { process.env.JWT_SECRET = 'integration-test-secret'; });
beforeEach(async () => {
  await prisma.comment.deleteMany(); await prisma.favorite.deleteMany(); await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany(); await prisma.tag.deleteMany(); await prisma.follow.deleteMany(); await prisma.user.deleteMany();
});
afterAll(async () => { await prisma.$disconnect(); });

describe('tag endpoints', () => {
  it('returns an empty array when no articles exist', async () => {
    const response = await request(app).get('/api/tags');
    expect(response.body).toEqual({ tags: [] });
  });

  it('lists unique tags after articles are created', async () => {
    const authToken = await token();
    await createArticle(authToken, 'One', ['typescript', 'api']);
    await createArticle(authToken, 'Two', ['api', 'testing']);
    const response = await request(app).get('/api/tags');
    expect(response.body.tags).toEqual(['api', 'testing', 'typescript']);
  });

  it('filters articles using persisted tags', async () => {
    const authToken = await token();
    await createArticle(authToken, 'Tagged', ['typescript']);
    await createArticle(authToken, 'Other', ['testing']);
    const response = await request(app).get('/api/articles?tag=typescript');
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toEqual(['typescript']);
  });

  it('persists and returns replacement tags when updating an article', async () => {
    const authToken = await token();
    const slug = await createArticle(authToken, 'Editable', ['old']);
    const response = await request(app).put(`/api/articles/${slug}`).set('Authorization', `Token ${authToken}`).send({
      article: { tagList: ['new'] },
    });
    expect(response.body.article.tagList).toEqual(['new']);
    expect((await request(app).get('/api/tags')).body.tags).toEqual(['new']);
  });
});
