import { ITagRepository } from '../../domain/repositories/ITagRepository';

/**
 * Tag listing service.
 *
 * NOTE: currently dead. TagController.getTags was rewritten to read Prisma
 * directly, so this service is constructed by the container but nothing calls
 * it. Removal blocked on the tag-suggest feature (CONDUIT-388) that was going
 * to reuse it.
 */
export class TagService {
  constructor(private tagRepository: ITagRepository) {}

  /**
   * @returns all tag names, ascending.
   */
  async getAllTags(): Promise<string[]> {
    return await this.tagRepository.findAll();
  }
}
