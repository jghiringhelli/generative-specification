import { generateSlug, generateUniqueSlug } from './slug';

describe('slug utils', () => {
  describe('generateSlug', () => {
    it('converts_title_to_lowercase_with_hyphens', () => {
      expect(generateSlug('How to Train Your Dragon')).toBe('how-to-train-your-dragon');
    });

    it('removes_special_characters', () => {
      expect(generateSlug('Hello, World!')).toBe('hello-world');
    });

    it('replaces_multiple_spaces_with_single_hyphen', () => {
      expect(generateSlug('Hello    World')).toBe('hello-world');
    });

    it('removes_leading_and_trailing_hyphens', () => {
      expect(generateSlug('-Hello World-')).toBe('hello-world');
    });

    it('handles_empty_string', () => {
      expect(generateSlug('')).toBe('');
    });
  });

  describe('generateUniqueSlug', () => {
    it('returns_base_slug_if_unique', async () => {
      const checker = async (slug: string) => false;
      const result = await generateUniqueSlug('my-article', checker);
      expect(result).toBe('my-article');
    });

    it('appends_counter_if_base_slug_exists', async () => {
      let callCount = 0;
      const checker = async (slug: string) => {
        callCount++;
        return slug === 'my-article';
      };

      const result = await generateUniqueSlug('my-article', checker);
      expect(result).toBe('my-article-1');
      expect(callCount).toBe(2); // Check base, check base-1
    });

    it('increments_counter_until_unique', async () => {
      const existing = new Set(['my-article', 'my-article-1', 'my-article-2']);
      const checker = async (slug: string) => existing.has(slug);

      const result = await generateUniqueSlug('my-article', checker);
      expect(result).toBe('my-article-3');
    });
  });
});
