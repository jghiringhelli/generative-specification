import { slugify } from '../../src/modules/articles/slug.utils';

describe('Slug Generation Unit Tests', () => {
  it('converts a title string to kebab-case with timestamp suffix', () => {
    const fixedTimestamp = 1600000000000;
    const slug = slugify('How to Train Your Dragon', fixedTimestamp);

    expect(slug).toBe('how-to-train-your-dragon-1600000000000');
  });

  it('strips special punctuation and symbols from title', () => {
    const fixedTimestamp = 1700000000000;
    const slug = slugify('Hello, World! #2026 @Pragma', fixedTimestamp);

    expect(slug).toBe('hello-world-2026-pragma-1700000000000');
  });

  it('handles empty or whitespace-only title gracefully by using default fallback', () => {
    const fixedTimestamp = 1750000000000;
    const slug = slugify('   ', fixedTimestamp);

    expect(slug).toBe('article-1750000000000');
  });

  it('handles multiple consecutive spaces and dashes by collapsing them', () => {
    const fixedTimestamp = 1800000000000;
    const slug = slugify('Multiple   spaces---and   dashes', fixedTimestamp);

    expect(slug).toBe('multiple-spaces-and-dashes-1800000000000');
  });
});
