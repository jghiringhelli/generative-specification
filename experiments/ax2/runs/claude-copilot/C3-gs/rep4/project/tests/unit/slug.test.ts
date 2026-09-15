import { generateSlug } from '../../src/services/slug';

describe('generateSlug', () => {
  it('produces a lowercase hyphenated slug from a title', () => {
    expect(generateSlug('Hello World')).toMatch(/^hello-world-[0-9a-f]{8}$/);
  });

  it('strips special characters', () => {
    expect(generateSlug('C++ & Rust!')).toMatch(/^c-rust-[0-9a-f]{8}$/);
  });

  it('produces unique suffixes for the same title', () => {
    expect(generateSlug('Same Title')).not.toBe(generateSlug('Same Title'));
  });

  it('falls back to a suffix-only slug for empty titles', () => {
    expect(generateSlug('!!!')).toMatch(/^[0-9a-f]{8}$/);
  });
});
