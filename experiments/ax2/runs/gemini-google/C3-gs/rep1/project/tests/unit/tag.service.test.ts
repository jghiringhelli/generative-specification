import { TagService } from '../../src/services/TagService';
import { ITagRepository } from '../../src/repositories/ITagRepository';

class FakeTagRepository implements ITagRepository {
  private tags: string[] = [];

  constructor(tags: string[] = []) {
    this.tags = tags;
  }

  async findAll(): Promise<string[]> {
    return this.tags;
  }
}

describe('TagService', () => {
  it('returns all tags from repository', async () => {
    const fakeRepo = new FakeTagRepository(['reactjs', 'angularjs', 'dragons']);
    const tagService = new TagService(fakeRepo);

    const tags = await tagService.getTags();
    expect(tags).toEqual(['reactjs', 'angularjs', 'dragons']);
  });

  it('returns empty array when no tags exist', async () => {
    const fakeRepo = new FakeTagRepository([]);
    const tagService = new TagService(fakeRepo);

    const tags = await tagService.getTags();
    expect(tags).toEqual([]);
  });
});
