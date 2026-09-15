import request from 'supertest';
import { buildTestHarness } from '../helpers/testHarness';
import { authHeader, registerUser } from '../helpers/apiClient';

describe('Tag endpoints', () => {
  it('GET /api/tags returns unique tags across articles', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app);
    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(token))
      .send({
        article: { title: 'A', description: 'd', body: 'b', tagList: ['dragons', 'training'] },
      });
    await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(token))
      .send({
        article: { title: 'B', description: 'd', body: 'b', tagList: ['dragons', 'flight'] },
      });
    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags.sort()).toEqual(['dragons', 'flight', 'training']);
  });

  it('GET /api/tags returns an empty list when no articles exist', async () => {
    const { app } = buildTestHarness();
    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual([]);
  });
});
