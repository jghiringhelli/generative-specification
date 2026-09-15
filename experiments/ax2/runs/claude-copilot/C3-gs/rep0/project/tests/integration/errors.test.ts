import request from 'supertest';
import { buildTestHarness } from '../helpers/testApp';

describe('Unmatched routes', () => {
  it('returns 404 in the Conduit error format for an unknown path', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.errors.body).toEqual(expect.any(Array));
  });
});

describe('Invalid token handling', () => {
  it('returns 401 for a malformed Authorization header', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/user').set('Authorization', 'Token garbage');
    expect(res.status).toBe(401);
    expect(res.body.errors.body).toEqual(expect.any(Array));
  });
});
