import request from 'supertest';
import { createApp } from '../../src/app';
import { AuthService } from '../../src/auth/AuthService';
import { ProfileService } from '../../src/profiles/ProfileService';
import { ITagRepository } from '../../src/repositories/ITagRepository';
import { TagService } from '../../src/tags/TagService';
import { TestPasswordHasher, TestTokenService } from '../support/AuthTestDoubles';
import { InMemoryProfileRepository } from '../support/InMemoryProfileRepository';
import { InMemoryUserRepository } from '../support/InMemoryUserRepository';

class TestTagRepository implements ITagRepository {
  public async list(): Promise<ReadonlyArray<string>> {
    return ['api', 'typescript'];
  }
}

describe('GET /api/tags', () => {
  it('returns all unique tags used by articles', async () => {
    const users = new InMemoryUserRepository();
    const tokens = new TestTokenService();
    const app = createApp({
      authService: new AuthService(users, new TestPasswordHasher(), tokens),
      tokenService: tokens,
      profileService: new ProfileService(new InMemoryProfileRepository(users)),
      tagService: new TagService(new TestTagRepository()),
    });

    await request(app).get('/api/tags')
      .expect(200)
      .expect({ tags: ['api', 'typescript'] });
  });
});
