/**
 * Unit tests for {@link slugify}.
 *
 * The base slug transform is pure and deterministic; uniqueness (the collision
 * suffix) is the service's concern and is tested there. These pin the contract
 * the article slug depends on.
 *
 * @gs-links: docs/specs/articles.md
 */
import { describe, expect, it } from '@jest/globals';
import { slugify } from './slug.js';

describe('slugify', () => {
  it('lower-cases and hyphenates a multi-word title', () => {
    expect(slugify('How To Train Your Dragon')).toBe('how-to-train-your-dragon');
  });

  it('collapses runs of punctuation and whitespace into single hyphens', () => {
    expect(slugify('  Hello,   World!! ')).toBe('hello-world');
  });

  it('strips accents/diacritics to ASCII', () => {
    expect(slugify('Crème Brûlée')).toBe('creme-brulee');
  });

  it('falls back to "article" when the title has no slug-able characters', () => {
    expect(slugify('!!!')).toBe('article');
  });

  it('keeps existing digits', () => {
    expect(slugify('Top 10 Tips')).toBe('top-10-tips');
  });
});
