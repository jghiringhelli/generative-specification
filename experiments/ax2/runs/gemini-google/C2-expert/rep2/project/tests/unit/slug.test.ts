import { generateSlug } from '../../src/lib/slug';

describe('Slug Generator Utility', () => {
  it('converts title to lowercase kebab-case format with timestamp suffix', () => {
    const title = 'How to Build RealWorld Apps';
    const slug = generateSlug(title);

    expect(slug).toMatch(/^how-to-build-realworld-apps-\d+$/);
  });

  it('strips special punctuation and symbols leaving clean hyphen-separated words', () => {
    const title = 'Hello World! What #is $this & That?';
    const slug = generateSlug(title);

    expect(slug).toMatch(/^hello-world-what-is-this-that-\d+$/);
  });

  it('provides fallback base when title contains only whitespace and non-alphanumeric symbols', () => {
    const title = '!!! ??? ***';
    const slug = generateSlug(title);

    expect(slug).toMatch(/^article-\d+$/);
  });

  it('produces unique slugs for identical titles generated sequentially', async () => {
    const title = 'Duplicate Title';
    const slug1 = generateSlug(title);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const slug2 = generateSlug(title);

    expect(slug1).not.toBe(slug2);
  });
});
