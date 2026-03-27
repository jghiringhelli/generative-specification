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

// Shared user store — profileRepo delegates user lookups to userRepo.
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

const ALICE = { email: 'alice@example.com', username: 'alice', password: 'Password123!' };
const BOB = { email: 'bob@example.com', username: 'bob', password: 'Password123!' };

/** Register a user and return their JWT token. */
async function registerAndGetToken(user: typeof ALICE): Promise<string> {
  const res = await request(app).post('/api/users').send({ user });
  return res.body.user.token as string;
}

beforeEach(() => {
  userRepo.clear();
  profileRepo.clear();
  articleRepo.clear();
  commentRepo.clear();
});

// =============================================================================
// GET /api/profiles/:username
// =============================================================================
describe('GET /api/profiles/:username', () => {
  it('returns 200 with profile envelope for an existing user', async () => {
    await registerAndGetToken(ALICE);

    const res = await request(app).get('/api/profiles/alice');

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('alice');
    expect(res.body.profile).toHaveProperty('bio');
    expect(res.body.profile).toHaveProperty('image');
    expect(res.body.profile.following).toBe(false);
  });

  it('returns following: false for anonymous viewer', async () => {
    await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);

    // Bob follows Alice
    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    // Anonymous viewer — no token
    const res = await request(app).get('/api/profiles/alice');

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it('returns following: true when authenticated viewer follows the profile', async () => {
    await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);

    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    const res = await request(app)
      .get('/api/profiles/alice')
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('returns 404 with profile error envelope when user does not exist', async () => {
    const res = await request(app).get('/api/profiles/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('profile');
  });
});

// =============================================================================
// POST /api/profiles/:username/follow
// =============================================================================
describe('POST /api/profiles/:username/follow', () => {
  it('returns 200 with profile envelope and following: true on success', async () => {
    await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);

    const res = await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('alice');
    expect(res.body.profile.following).toBe(true);
  });

  it('is idempotent — second follow returns 200 with following: true', async () => {
    await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);

    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    const res = await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('returns 401 when Authorization header is missing', async () => {
    await registerAndGetToken(ALICE);

    const res = await request(app).post('/api/profiles/alice/follow');

    expect(res.status).toBe(401);
    expect(res.body.errors).toHaveProperty('token');
  });

  it('returns 404 with profile error envelope when target user does not exist', async () => {
    const bobToken = await registerAndGetToken(BOB);

    const res = await request(app)
      .post('/api/profiles/nonexistent/follow')
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('profile');
  });
});

// =============================================================================
// DELETE /api/profiles/:username/follow
// =============================================================================
describe('DELETE /api/profiles/:username/follow', () => {
  it('returns 200 with profile envelope and following: false on success', async () => {
    await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);

    // Follow first
    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    const res = await request(app)
      .delete('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('alice');
    expect(res.body.profile.following).toBe(false);
  });

  it('is idempotent — unfollow when not following returns 200 with following: false', async () => {
    await registerAndGetToken(ALICE);
    const bobToken = await registerAndGetToken(BOB);

    const res = await request(app)
      .delete('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it('returns 401 when Authorization header is missing', async () => {
    await registerAndGetToken(ALICE);

    const res = await request(app).delete('/api/profiles/alice/follow');

    expect(res.status).toBe(401);
    expect(res.body.errors).toHaveProperty('token');
  });

  it('returns 404 with profile error envelope when target user does not exist', async () => {
    const bobToken = await registerAndGetToken(BOB);

    const res = await request(app)
      .delete('/api/profiles/nonexistent/follow')
      .set('Authorization', `Token ${bobToken}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toHaveProperty('profile');
  });
});
