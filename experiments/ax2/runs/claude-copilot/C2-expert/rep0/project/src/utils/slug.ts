/**
 * Generates a URL-friendly, unique slug from an article title.
 * Combines a kebab-case rendering of the title with a timestamp suffix to
 * guarantee uniqueness across articles with identical titles.
 * @param title The article title to slugify.
 * @returns The generated slug.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Date.now().toString(36);
  return base.length > 0 ? `${base}-${suffix}` : suffix;
}
