/**
 * Generates a unique URL-friendly slug from an article title.
 * Formats title as kebab-case and appends a timestamp suffix.
 *
 * @param {string} title The title of the article
 * @returns {string} The generated unique slug
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const safeBase = base.length > 0 ? base : 'article';
  const suffix = Date.now().toString(36);
  return `${safeBase}-${suffix}`;
}
