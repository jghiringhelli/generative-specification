import request from 'supertest';
import { buildTestHarness } from '../helpers/testHarness';
import { authHeader, registerUser } from '../helpers/apiClient';

describe('Error envelope conformance', () => {
  it('returns the { errors: { body: [...] } } shape for 422', async () => {
    const { app } = buildTestHarness();
    const response = await request(app)
      .post('/api/users')
      .send({ user: { username: '', email: 'bad', password: 'x' } });
    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('errors.body');
    expect(Array.isArray(response.body.errors.body)).toBe(true);
  });

  it('returns the envelope for 401 unauthenticated access', async () => {
    const { app } = buildTestHarness();
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
    expect(Array.isArray(response.body.errors.body)).toBe(true);
  });

  it('returns the envelope for 401 with an invalid token', async () => {
    const { app } = buildTestHarness();
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', authHeader('not-a-valid-token'));
    expect(response.status).toBe(401);
    expect(Array.isArray(response.body.errors.body)).toBe(true);
  });

  it('returns the envelope for 403 forbidden actions', async () => {
    const { app } = buildTestHarness();
    const { token } = await registerUser(app, { username: 'alice', email: 'alice@example.com' });
    const created = await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(token))
      .send({ article: { title: 'Mine', description: 'd', body: 'b', tagList: [] } });
    const { token: other } = await registerUser(app, { username: 'bob', email: 'bob@example.com' });
    const response = await request(app)
      .delete(`/api/articles/${created.body.article.slug}`)
      .set('Authorization', authHeader(other));
    expect(response.status).toBe(403);
    expect(Array.isArray(response.body.errors.body)).toBe(true);
  });

  it('returns the envelope for 404 missing resources', async () => {
    const { app } = buildTestHarness();
    const response = await request(app).get('/api/articles/does-not-exist');
    expect(response.status).toBe(404);
    expect(Array.isArray(response.body.errors.body)).toBe(true);
  });
});
