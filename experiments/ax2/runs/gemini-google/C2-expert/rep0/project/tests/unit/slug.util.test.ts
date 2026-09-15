import { generateSlug } from '../../src/utils/slug.util';

describe('Slug utility', () => {
  it('converts title to kebab-case with timestamp suffix', () => {
    const fixedTimestamp = 1700000000000;
    const slug = generateSlug('How to Train Your Dragon', fixedTimestamp);

    expect(slug).toBe('how-to-train-your-dragon-1700000000000');
  });

  it('strips punctuation and special characters from title', () => {
    const fixedTimestamp = 1700000000000;
    const slug = generateSlug('Hello, World! This is #1 & Best??', fixedTimestamp);

    expect(slug).toBe('hello-world-this-is-1-best-1700000000000');
  });

  it('handles empty title by falling back to article prefix with timestamp', () => {
    const fixedTimestamp = 1700000000000;
    const slug = generateSlug('   ', fixedTimestamp);

    expect(slug).toBe('article-1700000000000');
  });
});
