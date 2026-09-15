/**
 * Slug generation utility.
 * Transforms a human title into a kebab-cased URL slug appended with a unique timestamp suffix.
 *
 * @param {string} title - Article title
 * @param {number} [timestamp] - Optional custom timestamp (defaults to Date.now())
 * @returns {string} Unique URL slug
 */
export function generateSlug(title: string, timestamp: number = Date.now()): string {
  const sanitized = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const baseSlug = sanitized.length > 0 ? sanitized : 'article';
  return `${baseSlug}-${timestamp}`;
}
