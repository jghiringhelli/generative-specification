import { TagService } from './tag.service';
import { ITagRepository } from '../repositories/tag.repository';
import { Tag } from '@prisma/client';

describe('TagService', () => {
  let tagService: TagService;
  let mockTagRepository: jest.Mocked<ITagRepository>;

  beforeEach(() => {
    mockTagRepository = {
      findByName: jest.fn(),
      findAll: jest.fn(),
      upsertMany: jest.fn()
    };

    tagService = new TagService(mockTagRepository);
  });

  describe('getTags', () => {
    it('get_tags_returns_alphabetically_sorted_tag_names', async () => {
      const mockTags: Tag[] = [
        { id: 1, name: 'typescript' },
        { id: 2, name: 'nodejs' },
        { id: 3, name: 'react' }
      ];

      mockTagRepository.findAll.mockResolvedValue(mockTags);

      const result = await tagService.getTags();

      expect(result.tags).toEqual(['typescript', 'nodejs', 'react']);
    });

    it('get_tags_with_no_tags_returns_empty_array', async () => {
      mockTagRepository.findAll.mockResolvedValue([]);

      const result = await tagService.getTags();

      expect(result.tags).toEqual([]);
    });

    it('get_tags_returns_only_tag_names_not_full_objects', async () => {
      const mockTags: Tag[] = [
        { id: 1, name: 'testing' }
      ];

      mockTagRepository.findAll.mockResolvedValue(mockTags);

      const result = await tagService.getTags();

      expect(result).toEqual({ tags: ['testing'] });
      expect(result.tags[0]).toBe('testing');
    });
  });
});
