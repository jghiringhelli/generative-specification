import { generateSlug, updateSlug } from '../../utils/slug';

describe('Slug Utils', () => {
  describe('generateSlug', () => {
    it('converts title to kebab-case', () => {
      const slug = generateSlug('How to Train Your Dragon');
      
      expect(slug).toMatch(/^how-to-train-your-dragon-[a-z0-9]+$/);
    });

    it('removes special characters', () => {
      const slug = generateSlug('Hello, World! @#$%');
      
      expect(slug).toMatch(/^hello-world-[a-z0-9]+$/);
    });

    it('handles multiple spaces', () => {
      const slug = generateSlug('Multiple   Spaces   Here');
      
      expect(slug).toMatch(/^multiple-spaces-here-[a-z0-9]+$/);
    });

    it('generates unique slugs for same title', () => {
      const slug1 = generateSlug('Same Title');
      const slug2 = generateSlug('Same Title');
      
      expect(slug1).not.toBe(slug2);
    });

    it('trims leading and trailing spaces', () => {
      const slug = generateSlug('  Trimmed Title  ');
      
      expect(slug).toMatch(/^trimmed-title-[a-z0-9]+$/);
    });
  });

  describe('updateSlug', () => {
    it('preserves timestamp suffix when updating title', () => {
      const originalSlug = 'old-title-abc123';
      const newSlug = updateSlug(originalSlug, 'New Title');
      
      expect(newSlug).toBe('new-title-abc123');
    });

    it('handles complex original slug', () => {
      const originalSlug = 'how-to-train-your-dragon-xyz789';
      const newSlug = updateSlug(originalSlug, 'Updated Dragon Guide');
      
      expect(newSlug).toBe('updated-dragon-guide-xyz789');
    });
  });
});
