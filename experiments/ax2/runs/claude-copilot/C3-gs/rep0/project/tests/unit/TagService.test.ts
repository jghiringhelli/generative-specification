import { TagService } from '../../src/services/TagService';
import { ITagRepository } from '../../src/repositories/ITagRepository';

/**
 * Simple stub tag repository returning a fixed list.
 */
class StubTagRepository implements ITagRepository {
  /**
   * @param tags - The tags to return.
   */
  constructor(private readonly tags: string[]) {}

  /** @inheritdoc */
  async findAll(): Promise<string[]> {
    return this.tags;
  }
}

describe('TagService', () => {
  it('returns a sorted, de-duplicated list', async () => {
    const service = new TagService(new StubTagRepository(['node', 'react', 'node']));
    const result = await service.list();
    expect(result.tags).toEqual(['node', 'react']);
  });

  it('returns an empty list when there are no tags', async () => {
    const service = new TagService(new StubTagRepository([]));
    const result = await service.list();
    expect(result.tags).toEqual([]);
  });
});
