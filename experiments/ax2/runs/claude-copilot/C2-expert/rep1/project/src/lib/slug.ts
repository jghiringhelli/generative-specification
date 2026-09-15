/**
 * Generates a URL-safe slug from an article title. A timestamp suffix is
 * appended to guarantee uniqueness across articles with identical titles.
 * @param title the article title
 * @param now optional millisecond timestamp (injectable for testing)
 * @returns the kebab-case slug with a timestamp suffix
 */
export function generateSlug(title: string, now: number = Date.now()): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const normalized = base.length > 0 ? base : 'article';
  return `${normalized}-${now.toString(36)}`;
}
