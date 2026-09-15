import { generateSlug } from '../../src/utils/slug';

describe('slug generation', () => {
  it('converts a title to lowercase kebab-case', () => {
    const slug = generateSlug('How To Train Your Dragon');
    expect(slug).toMatch(/^how-to-train-your-dragon-[a-z0-9]+$/);
  });

  it('strips punctuation and collapses whitespace', () => {
    const slug = generateSlug('Hello,   World!!!');
    expect(slug).toMatch(/^hello-world-[a-z0-9]+$/);
  });

  it('produces unique slugs for identical titles', () => {
    const first = generateSlug('Same Title');
    const second = generateSlug('Same Title');
    expect(first).not.toBe(second);
  });

  it('falls back to a suffix-only slug when the title has no word characters', () => {
    const slug = generateSlug('!!!');
    expect(slug).toMatch(/^[a-z0-9]+$/);
  });
});
