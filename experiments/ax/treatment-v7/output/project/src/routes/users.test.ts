import request from 'supertest';
import { createApp } from '../app';
import { InMemoryUserRepository } from '../repositories/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../repositories/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../repositories/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../repositories/InMemoryCommentRepository';
import { InMemoryTagRepository } from '../repositories/InMemoryTagRepository';
import { UserService } from '../services/UserService';
import { ProfileService } from '../services/ProfileService';
import { ArticleService } from '../services/ArticleService';
import { CommentService } from '../services/CommentService';
import { TagService } from '../services/TagService';

// Shared user store — all repos that need user lookups reference this instance.
const userRepo = new InMemoryUserRepository();
const profileRepo = new InMemoryProfileRepository(userRepo);
const articleRepo = new InMemoryArticleRepository(userRepo);
const commentRepo = new InMemoryCommentRepository(userRepo);
const tagRepo = new InMemoryTagRepository(articleRepo);

const userService = new UserService(userRepo);
const profileService = new ProfileService(profileRepo);
const articleService = new ArticleService(articleRepo);
const commentService = new CommentService(commentRepo, articleRepo);
const tagService = new TagService(tagRepo);
const app = createApp({ userService, profileService, articleService, commentService, tagService });

const SEED = {
  email: 'integration@example.com',
  username: 'integrationuser',
  password: 'Password123!',
};

beforeEach(() => {
  userRepo.clear();
  profileRepo.clear();
  articleRepo.clear();
  commentRepo.clear();
});

// =============================================================================
// POST /api/users — register
// =============================================================================
describe('POST /api/users', () => {
  it('returns 201 with user envelope on successful registration', async () => {
    const res = await request(app).post('/api/users').send({ user: SEED });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(SEED.email);
    expect(res.body.user.username).toBe(SEED.username);
    expect(typeof res.body.user.token).toBe('string');
    expect(res.body.user.bio).toBeNull();
    expect(res.body.user.image).toBeNull();
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 422 with field errors when email is missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: SEED.username, password: SEED.password } });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('returns 422 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: { email: 'not-an-email', username: SEED.username, password: SEED.password } });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('returns 409 when email is already registered', async () => {
    await request(app).post('/api/users').send({ user: SEED });

    const res = await request(app)
      .post('/api/users')
      .send({ user: { email: SEED.email, username: 'newuser', password: SEED.password } });

    expect(res.status).toBe(409);
    expect(res.body.errors).toHaveProperty('email');
  });
});

// =============================================================================
// POST /api/users/login — login
// =============================================================================
describe('POST /api/users/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/users').send({ user: SEED });
  });

  it('returns 200 with user envelope on valid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: SEED.email, password: SEED.password } });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(SEED.email);
    expect(typeof res.body.user.token).toBe('string');
  });

  it('returns 422 when email is blank', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: '', password: SEED.password } });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('returns 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: SEED.email, password: 'wrong-password' } });

    expect(res.status).toBe(401);
    expect(res.body.errors['credentials']).toBeDefined();
  });
});

// =============================================================================
// GET /api/user — current user
// =============================================================================
describe('GET /api/user', () => {
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/users').send({ user: SEED });
    token = res.body.user.token as string;
  });

  it('returns 200 with current user when token is valid', async () => {
    const res = await request(app).get('/api/user').set('Authorization', `Token ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(SEED.email);
    expect(res.body.user.username).toBe(SEED.username);
    expect(typeof res.body.user.token).toBe('string');
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/user');

    expect(res.status).toBe(401);
    expect(res.body.errors).toHaveProperty('token');
  });

  it('returns 401 when token is malformed', async () => {
    const res = await request(app).get('/api/user').set('Authorization', 'Token invalid.jwt.here');

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// PUT /api/user — update current user
// =============================================================================
describe('PUT /api/user', () => {
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/users').send({ user: SEED });
    token = res.body.user.token as string;
  });

  it('returns 200 with updated user when bio is changed', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'Hello world' } });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('Hello world');
  });

  it('coerces empty string bio to null in response (§10)', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: '' } });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBeNull();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).put('/api/user').send({ user: { bio: 'test' } });

    expect(res.status).toBe(401);
  });

  it('returns 422 when update body has no recognized fields', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: {} });

    expect(res.status).toBe(422);
  });

  it('returns 409 when new email is already taken', async () => {
    await request(app)
      .post('/api/users')
      .send({ user: { email: 'other@example.com', username: 'other', password: SEED.password } });

    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { email: 'other@example.com' } });

    expect(res.status).toBe(409);
    expect(res.body.errors).toHaveProperty('email');
  });
});
