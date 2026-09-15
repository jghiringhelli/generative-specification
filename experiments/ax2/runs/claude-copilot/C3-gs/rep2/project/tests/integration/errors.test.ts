import request from 'supertest';
import { buildTestHarness } from '../support/testApp';
import { authHeader, registerUser } from '../support/apiHelpers';

describe('Error envelope conformance', () => {
  it('validation errors use { errors: { <field>: [..] } }', async () => {
    const { app } = buildTestHarness();
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: '', email: 'bad', password: '' } });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
    expect(typeof res.body.errors).toBe('object');
  });

  it('domain errors use { errors: { body: ["message"] } }', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/profiles/ghost');

    expect(res.status).toBe(404);
    expect(Array.isArray(res.body.errors.body)).toBe(true);
    expect(res.body.errors.body[0]).toEqual(expect.any(String));
  });

  it('401 errors use the body envelope', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
    expect(Array.isArray(res.body.errors.body)).toBe(true);
  });

  it('403 errors use the body envelope', async () => {
    const { app } = buildTestHarness();
    const owner = await registerUser(app, { username: 'owner' });
    const intruder = await registerUser(app, { username: 'intruder' });
    const created = await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(owner.token))
      .send({ article: { title: 'Owned', description: 'd', body: 'b' } });
    const slug = created.body.article.slug;

    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', authHeader(intruder.token));

    expect(res.status).toBe(403);
    expect(Array.isArray(res.body.errors.body)).toBe(true);
  });

  it('unmatched routes return a 404 body envelope', async () => {
    const { app } = buildTestHarness();
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(Array.isArray(res.body.errors.body)).toBe(true);
  });
});
