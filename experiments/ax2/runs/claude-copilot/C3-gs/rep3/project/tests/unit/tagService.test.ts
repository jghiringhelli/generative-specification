import { TagService } from '../../src/services/TagService';
import { InMemoryTagRepository } from '../fixtures/inMemoryRepositories';

describe('TagService', () => {
  it('returns sorted unique tags', async () => {
    const repo = new InMemoryTagRepository(() => ['b', 'a', 'b', 'c']);
    const service = new TagService(repo);
    const result = await service.list();
    expect(result.tags).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty list when there are no tags', async () => {
    const service = new TagService(new InMemoryTagRepository(() => []));
    const result = await service.list();
    expect(result.tags).toEqual([]);
  });
});
