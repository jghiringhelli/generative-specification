import { generateSlug } from '../../src/utils/slug';

describe('slug generation', () => {
  it('converts a title to kebab-case', () => {
    const slug = generateSlug('How To Train Your Dragon');
    expect(slug.startsWith('how-to-train-your-dragon-')).toBe(true);
  });

  it('produces unique slugs for identical titles', () => {
    const first = generateSlug('Same Title');
    const second = generateSlug('Same Title');
    expect(first).not.toBe(second);
  });

  it('strips punctuation and collapses separators', () => {
    const slug = generateSlug('Hello, World! & Friends');
    expect(slug.startsWith('hello-world-friends-')).toBe(true);
  });

  it('falls back to a timestamp suffix when the title has no letters', () => {
    const slug = generateSlug('!!!');
    expect(slug.length).toBeGreaterThan(0);
    expect(slug.startsWith('-')).toBe(false);
  });
});
