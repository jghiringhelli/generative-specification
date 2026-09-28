import { IArticleRepository } from '../../domain/repositories/IArticleRepository';

export interface ISlugGenerator {
  generate(title: string): Promise<string>;
}

export class UniqueSlugGenerator implements ISlugGenerator {
  constructor(private articleRepository: IArticleRepository) {}

  async generate(title: string): Promise<string> {
    let slug = this.slugify(title);
    let count = 0;
    let uniqueSlug = slug;

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
