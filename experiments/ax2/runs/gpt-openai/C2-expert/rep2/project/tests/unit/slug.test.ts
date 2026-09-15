import { createArticleSlug } from '../../src/articles/slug';

describe('article slug generation', () => {
  test('converts a title to kebab case and appends the timestamp', () => {
    expect(createArticleSlug('Hello, TypeScript World!', 12345)).toBe('hello-typescript-world-12345');
  });

  test('uses an article fallback when the title has no URL-safe characters', () => {
    expect(createArticleSlug('---', 12345)).toBe('article-12345');
  });
});
