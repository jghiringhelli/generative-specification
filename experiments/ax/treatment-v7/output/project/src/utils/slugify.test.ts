import { generateSlug } from './slugify';

describe('generateSlug', () => {
  it('lowercases the title', () => {
    const slug = generateSlug('Hello World');
    // prefix part is lowercase
    expect(slug.split('-').slice(0, -1).join('-')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    const slug = generateSlug('foo bar baz');
    expect(slug).toMatch(/^foo-bar-baz-/);
  });

  it('strips non-alphanumeric characters', () => {
    const slug = generateSlug('foo & bar!');
    expect(slug).toMatch(/^foo-bar-/);
  });

  it('appends an 8-character hex suffix for uniqueness', () => {
    const slug = generateSlug('my title');
    const suffix = slug.split('-').at(-1)!;
    expect(suffix).toHaveLength(8);
    expect(suffix).toMatch(/^[0-9a-f]{8}$/);
  });

  it('produces different slugs for the same title (random suffix)', () => {
    const slug1 = generateSlug('same title');
    const slug2 = generateSlug('same title');
    // Extremely unlikely to collide — 1 in 2^32
    expect(slug1).not.toBe(slug2);
  });

  it('trims the slug base to 90 characters before the suffix', () => {
    const longTitle = 'a'.repeat(200);
    const slug = generateSlug(longTitle);
    // base-slug + '-' + 8-char suffix = at most 91 + 1 + 8 = 100 chars
    expect(slug.length).toBeLessThanOrEqual(100);
  });

  it('collapses multiple spaces and hyphens to a single hyphen', () => {
    const slug = generateSlug('foo   ---   bar');
    expect(slug).toMatch(/^foo-bar-/);
  });

  it('handles an all-symbol title gracefully', () => {
    const slug = generateSlug('!!!');
    // base is empty after stripping; suffix still appended
    expect(slug).toMatch(/^-?[0-9a-f]{8}$/);
  });
});
