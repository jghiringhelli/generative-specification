
/**
 * Unit tests for TagService.
 */

import { TagService } from './tag.service';
import type { ITagRepository } from '../repositories/ITagRepository';

const mockTagRepository: jest.Mocked<ITagRepository> = {
  listAll: jest.fn(),
  upsertMany: jest.fn(),
  findByName: jest.fn()
};

describe('TagService', () => {
  let tagService: TagService;

  beforeEach(() => {
    jest.clearAllMocks();
    tagService = new TagService(mockTagRepository);
  });

  describe('getAllTags', () => {
    it('returns list of all tags', async () => {
      const tags = ['reactjs', 'angularjs', 'dragons'];
      mockTagRepository.listAll.mockResolvedValue(tags);

      const result = await tagService.getAllTags();

      expect(mockTagRepository.listAll).toHaveBeenCalled();
      expect(result).toEqual(tags);
    });

    it('returns empty array when no tags exist', async () => {
      mockTagRepository.listAll.mockResolvedValue([]);

      const result = await tagService.getAllTags();

      expect(result).toEqual([]);
    });
  });
});
