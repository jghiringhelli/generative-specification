import request from 'supertest';
import { buildTestHarness } from '../support/testApp';
import { authHeader, registerUser } from '../support/apiHelpers';

describe('Tag endpoints', () => {
  it('GET /api/tags returns an empty list when no articles exist (200)', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it('GET /api/tags returns unique tags across all articles', async () => {
    const { app } = buildTestHarness();
    const author = await registerUser(app);

    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'A', description: 'd', body: 'b', tagList: ['react', 'ts'] } });
    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'B', description: 'd', body: 'b', tagList: ['ts', 'node'] } });

    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect([...res.body.tags].sort()).toEqual(['node', 'react', 'ts']);
  });
});
