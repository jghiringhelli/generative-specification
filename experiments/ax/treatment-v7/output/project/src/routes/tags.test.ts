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

// Dynamic tag repo derives unique tags from articles in the shared articleRepo.
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

const ALICE = { email: 'tags-alice@example.com', username: 'tagsalice', password: 'Password123!' };

/** Register a user and return their JWT token. */
async function registerAndGetToken(): Promise<string> {
  const res = await request(app).post('/api/users').send({ user: ALICE });
  return res.body.user.token as string;
}

beforeEach(() => {
  userRepo.clear();
  profileRepo.clear();
  articleRepo.clear();
  commentRepo.clear();
});

describe('GET /api/tags', () => {
  it('returns empty tags array when no articles exist', async () => {
    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tags: [] });
  });

  it('returns all unique tags from published articles', async () => {
    const token = await registerAndGetToken();

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Article One', description: 'Desc', body: 'Body', tagList: ['react', 'node'] } });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Article Two', description: 'Desc', body: 'Body', tagList: ['node', 'typescript'] } });

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(expect.arrayContaining(['react', 'node', 'typescript']));
    expect(res.body.tags).toHaveLength(3);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tags)).toBe(true);
  });

  it('does not return duplicate tags when the same tag appears on multiple articles', async () => {
    const token = await registerAndGetToken();

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'First', description: 'D', body: 'B', tagList: ['shared'] } });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Second', description: 'D', body: 'B', tagList: ['shared'] } });

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    const shared = res.body.tags.filter((t: string) => t === 'shared');
    expect(shared).toHaveLength(1);
  });
});
