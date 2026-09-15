import request from 'supertest';
import { createApp } from '../../src/app';
import { resetDatabase, disconnect, createUser, TestUser } from '../helpers';

const app = createApp();

describe('tag endpoints', () => {
  let author: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    author = await createUser(app, { username: 'author' });
  });

  afterAll(async () => {
    await disconnect();
  });

  it('returns an empty array when no articles exist', async () => {
    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual([]);
  });

  it('returns the unique tags after articles are created', async () => {
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author.token}`)
      .send({
        article: {
          title: 'First',
          description: 'd',
          body: 'b',
          tagList: ['react', 'javascript'],
        },
      });
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author.token}`)
      .send({
        article: {
          title: 'Second',
          description: 'd',
          body: 'b',
          tagList: ['react', 'typescript'],
        },
      });

    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags.sort()).toEqual([
      'javascript',
      'react',
      'typescript',
    ]);
  });

  it('filters articles by a persisted tag', async () => {
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author.token}`)
      .send({
        article: {
          title: 'Tagged',
          description: 'd',
          body: 'b',
          tagList: ['vue'],
        },
      });

    const response = await request(app).get('/api/articles?tag=vue');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toContain('vue');
  });
});
