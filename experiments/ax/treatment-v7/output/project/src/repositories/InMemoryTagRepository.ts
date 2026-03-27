import type { ITagRepository } from './ITagRepository';
import type { InMemoryArticleRepository } from './InMemoryArticleRepository';

/**
 * In-memory test double for the tag repository port.
 *
 * Two modes:
 *   1. Static (no articleRepo): returns the tag list provided at construction time.
 *      Use for tests that only need a predictable fixed set of tags.
 *   2. Dynamic (articleRepo injected): derives unique tags from all articles in the
 *      provided in-memory article repository. Reflects changes made via `articleRepo`
 *      during the test without any manual synchronisation.
 *      Required for route-level tests that create articles and then query `/api/tags`.
 *
 * @example — static
 * const tagRepo = new InMemoryTagRepository(['react', 'node']);
 *
 * @example — dynamic
 * const articleRepo = new InMemoryArticleRepository(userRepo);
 * const tagRepo = new InMemoryTagRepository(articleRepo);
 */
export class InMemoryTagRepository implements ITagRepository {
  constructor(
    private readonly articleRepoOrStaticTags: InMemoryArticleRepository | string[] = [],
  ) {}

  /**
   * Return all unique tags.
   *
   * If constructed with an article repository, scans all articles for their tagLists
   * and returns the unique set, sorted alphabetically.
   * If constructed with a static list, returns that list sorted.
   *
   * @returns Sorted array of unique tag strings
   */
  async findAll(): Promise<string[]> {
    if (Array.isArray(this.articleRepoOrStaticTags)) {
      return [...this.articleRepoOrStaticTags].sort();
    }

    // Dynamic mode: derive tags from all articles in the linked article repo.
    const { articles } = await this.articleRepoOrStaticTags.findAll(
      {},
      { limit: 100_000, offset: 0 },
    );
    const tagSet = new Set<string>();
    for (const article of articles) {
      for (const tag of article.tagList) {
        tagSet.add(tag);
      }
    }
    return [...tagSet].sort();
  }
}
