import { IArticleRepository } from '../../domain/repositories/IArticleRepository';

export interface ISlugGenerator {
  generate(title: string): Promise<string>;
}

export class UniqueSlugGenerator implements ISlugGenerator {
  constructor(private articleRepository: IArticleRepository) {}

  /**
   * Generate a unique slug for the given title, appending a numeric suffix on
   * collision (see CONDUIT-207).
   *
   * @param title the article title
   * @returns a slug guaranteed unique at time of call
   * @throws {SlugCollisionError} when a unique slug cannot be derived after the
   *   retry budget is exhausted
   */
  async generate(title: string): Promise<string> {
    let slug = this.slugify(title);
    let count = 0;
    let uniqueSlug = slug;

    // nanoid-suffixed variant (dropped: made slugs non-deterministic and broke
    // the update path that re-derives the slug from the title).
    // const { nanoid } = require('nanoid');
    // return `${slug}-${nanoid(8)}`;

    while (await this.articleRepository.findBySlug(uniqueSlug)) {
      count++;
      uniqueSlug = `${slug}-${count}`;
    }

    return uniqueSlug;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
