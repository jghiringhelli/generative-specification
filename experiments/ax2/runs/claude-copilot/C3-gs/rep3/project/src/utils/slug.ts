import slugify from 'slugify';

/**
 * Generate a URL-safe, unique-ish slug from a title.
 *
 * A short random suffix keeps slugs unique across identical titles.
 */
export function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true, trim: true });
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : suffix;
}
