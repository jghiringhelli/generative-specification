// tests/unit/TagService.test.ts
import { TagService } from '../../src/services/TagService';
import { ITagRepository } from '../../src/repositories/ITagRepository';

describe('TagService Unit Tests', () => {
  let mockTagRepository: jest.Mocked<ITagRepository>;
  let tagService: TagService;

  beforeEach(() => {
    mockTagRepository = {
      findAll: jest.fn()
    };
    tagService = new TagService(mockTagRepository);
  });

  it('should return list of all unique tags', async () => {
    mockTagRepository.findAll.mockResolvedValue(['angularjs', 'dragons', 'react']);

    const tags = await tagService.getAllTags();
    expect(tags).toEqual(['angularjs', 'dragons', 'react']);
    expect(mockTagRepository.findAll).toHaveBeenCalled();
  });
});
