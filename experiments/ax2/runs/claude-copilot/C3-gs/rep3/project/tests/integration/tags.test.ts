import request from 'supertest';
import { buildTestHarness } from '../helpers/testApp';
import { authHeader, registerUser } from '../builders/userBuilder';

describe('GET /api/tags', () => {
  let harness: ReturnType<typeof buildTestHarness>;

  beforeEach(() => {
    harness = buildTestHarness();
  });

  it('returns all unique tags across articles', async () => {
    const user = await registerUser(harness.app, { username: 'tagger' });
    await request(harness.app)
      .post('/api/articles')
      .set('Authorization', authHeader(user.token))
      .send({
        article: {
          title: 'First',
          description: 'd',
          body: 'b',
          tagList: ['alpha', 'beta'],
        },
      });
    await request(harness.app)
      .post('/api/articles')
      .set('Authorization', authHeader(user.token))
      .send({
        article: {
          title: 'Second',
          description: 'd',
          body: 'b',
          tagList: ['beta', 'gamma'],
        },
      });

    const res = await request(harness.app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('returns an empty array when there are no tags', async () => {
    const res = await request(harness.app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });
});
