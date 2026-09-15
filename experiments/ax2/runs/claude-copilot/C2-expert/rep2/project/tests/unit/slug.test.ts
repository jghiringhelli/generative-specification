import { slugify } from '../../src/utils/slug';

describe('slugify', () => {
  it('converts a title to lowercase kebab-case', () => {
    expect(slugify('How To Train Your Dragon')).toMatch(/^how-to-train-your-dragon-[a-z0-9]+$/);
  });

  it('strips punctuation from the title', () => {
    expect(slugify('Hello, World!')).toMatch(/^hello-world-[a-z0-9]+$/);
  });

  it('appends a unique suffix so identical titles produce distinct slugs', async () => {
    const first = slugify('Same Title');
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = slugify('Same Title');
    expect(first).not.toBe(second);
  });

  it('falls back to a suffix when the title has no slug-safe characters', () => {
    expect(slugify('!!!')).toMatch(/^[a-z0-9]+$/);
  });
});
