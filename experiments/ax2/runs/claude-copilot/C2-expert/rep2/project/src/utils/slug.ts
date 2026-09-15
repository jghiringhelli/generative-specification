/**
 * Converts a title into a URL-safe kebab-case slug with a timestamp suffix
 * to guarantee uniqueness across articles sharing a title.
 * @param title the article title.
 * @returns a unique slug.
 */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Date.now().toString(36);
  return base ? `${base}-${suffix}` : suffix;
}
