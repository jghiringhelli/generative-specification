import request from 'supertest';
import { buildTestHarness } from '../helpers/testApp';

describe('Cross-cutting error behavior', () => {
  let harness: ReturnType<typeof buildTestHarness>;

  beforeEach(() => {
    harness = buildTestHarness();
  });

  it('returns 404 with the spec error body for unknown routes', async () => {
    const res = await request(harness.app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errors: { body: ['Not found'] } });
  });

  it('returns 401 when a malformed token is supplied', async () => {
    const res = await request(harness.app)
      .get('/api/user')
      .set('Authorization', 'Token not-a-real-jwt');
    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it('conforms all error responses to { errors: { <field>: [...] } }', async () => {
    const res = await request(harness.app)
      .post('/api/users')
      .send({ user: { username: '', email: 'bad', password: '' } });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
    expect(typeof res.body.errors).toBe('object');
  });
});
