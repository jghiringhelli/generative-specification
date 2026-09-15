import { generateSlug } from '../../src/utils/slug';

describe('Slug Generator Utility', () => {
  it('converts title to lowercase kebab-case and appends timestamp suffix', () => {
    const title = 'How to Train Your Dragon';
    const timestamp = 1600000000000;
    const slug = generateSlug(title, timestamp);

    expect(slug).toBe('how-to-train-your-dragon-1600000000000');
  });

  it('handles titles with special punctuation and spaces gracefully', () => {
    const title = '  Hello, World! & More???   ';
    const timestamp = 12345;
    const slug = generateSlug(title, timestamp);

    expect(slug).toBe('hello-world-more-12345');
  });

  it('uses default fallback prefix when title produces empty characters', () => {
    const title = '??? !!!';
    const timestamp = 999;
    const slug = generateSlug(title, timestamp);

    expect(slug).toBe('article-999');
  });
});
