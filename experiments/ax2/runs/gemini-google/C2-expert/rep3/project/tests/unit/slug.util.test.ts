import { generateSlug } from '../../src/utils/slug.util';

describe('Slug Generation Utility', () => {
  it('generates a lowercase kebab-case slug with timestamp suffix', () => {
    const slug = generateSlug('How to Train Your Dragon');
    expect(slug).toMatch(/^how-to-train-your-dragon-[a-z0-9]+$/);
  });

  it('handles titles with special characters gracefully', () => {
    const slug = generateSlug('Hello, World! @#2026?');
    expect(slug).toMatch(/^hello-world-2026-[a-z0-9]+$/);
  });

  it('generates fallback base when title has only special characters', () => {
    const slug = generateSlug('???!!!$$$');
    expect(slug).toMatch(/^article-[a-z0-9]+$/);
  });

  it('generates unique slugs for identical titles called subsequently', async () => {
    const slug1 = generateSlug('Unique Title');
    // slight delay for timestamp change
    await new Promise((resolve) => setTimeout(resolve, 5));
    const slug2 = generateSlug('Unique Title');
    expect(slug1).not.toEqual(slug2);
  });
});
