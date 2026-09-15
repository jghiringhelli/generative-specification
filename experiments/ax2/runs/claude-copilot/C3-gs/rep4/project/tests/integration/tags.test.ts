import request from 'supertest';
import { Application } from 'express';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser } from '../helpers/api';

describe('Tag endpoints', () => {
  let app: Application;

  beforeEach(() => {
    app = buildTestHarness().app;
  });

  it('GET /api/tags returns an empty list when no articles exist', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it('GET /api/tags returns unique tags across articles', async () => {
    const author = await registerUser(app, 'tagger', 'tagger@example.com');
    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'A', description: 'd', body: 'b', tagList: ['x', 'y'] } });
    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'B', description: 'd', body: 'b', tagList: ['y', 'z'] } });

    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect([...res.body.tags].sort()).toEqual(['x', 'y', 'z']);
  });
});
