/**
 * Slug generator utility.
 * Generates kebab-case slug with timestamp suffix to guarantee uniqueness.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const slugBase = base || 'article';
  const timestamp = Date.now();
  return `${slugBase}-${timestamp}`;
}
