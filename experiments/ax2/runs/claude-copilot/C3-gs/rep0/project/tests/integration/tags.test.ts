import request from 'supertest';
import {
  buildTestHarness,
  createTestArticle,
  registerTestUser
} from '../helpers/testApp';

describe('GET /api/tags', () => {
  it('returns an empty list when no articles exist', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it('returns all unique tags across articles, sorted', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerTestUser(app);
    await createTestArticle(app, token, { title: 'One', tagList: ['react', 'node'] });
    await createTestArticle(app, token, { title: 'Two', tagList: ['node', 'testing'] });
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(['node', 'react', 'testing']);
  });
});
