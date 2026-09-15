import { generateSlug } from '../../src/lib/slug';

describe('generateSlug', () => {
  it('converts a title to kebab-case and appends a timestamp suffix', () => {
    const slug = generateSlug('Hello World Title', 1000);
    expect(slug.startsWith('hello-world-title-')).toBe(true);
  });

  it('produces different slugs for the same title at different times', () => {
    const first = generateSlug('Same Title', 1000);
    const second = generateSlug('Same Title', 2000);
    expect(first).not.toBe(second);
  });

  it('strips punctuation and collapses whitespace into single hyphens', () => {
    const slug = generateSlug('  A, B & C!!  ', 1);
    expect(slug.startsWith('a-b-c-')).toBe(true);
  });

  it('falls back to a default base when the title has no alphanumerics', () => {
    const slug = generateSlug('!!!', 1);
    expect(slug.startsWith('article-')).toBe(true);
  });
});
