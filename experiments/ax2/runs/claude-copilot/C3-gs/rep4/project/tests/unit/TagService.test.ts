import { TagService } from '../../src/services/TagService';
import { InMemoryStore, InMemoryTagRepository, InMemoryArticleRepository, InMemoryUserRepository } from '../helpers/inMemory';

describe('TagService', () => {
  it('returns an empty list when no articles exist', async () => {
    const store = new InMemoryStore();
    const service = new TagService(new InMemoryTagRepository(store));
    expect(await service.listTags()).toEqual({ tags: [] });
  });

  it('returns unique, sorted tags across articles', async () => {
    const store = new InMemoryStore();
    const users = new InMemoryUserRepository(store);
    const articles = new InMemoryArticleRepository(store);
    const author = await users.create({ email: 'a@e.com', username: 'a', passwordHash: 'h' });
    await articles.create({
      slug: 's1', title: 't', description: 'd', body: 'b', tagList: ['b', 'a'], authorId: author.id,
    });
    await articles.create({
      slug: 's2', title: 't', description: 'd', body: 'b', tagList: ['a', 'c'], authorId: author.id,
    });
    const service = new TagService(new InMemoryTagRepository(store));
    expect(await service.listTags()).toEqual({ tags: ['a', 'b', 'c'] });
  });
});
