/**
 * Generates a URL-friendly slug from a title string.
 * Converts to lowercase kebab-case and appends a timestamp suffix for uniqueness.
 *
 * @param {string} title - The article title
 * @param {number} [timestamp=Date.now()] - Timestamp suffix for uniqueness
 * @returns {string} URL slug
 */
export function generateSlug(title: string, timestamp: number = Date.now()): string {
  const cleanTitle = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const base = cleanTitle || 'article';
  return `${base}-${timestamp}`;
}
