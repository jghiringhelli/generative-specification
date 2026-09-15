import slugify from 'slugify';

/**
 * Build a URL-safe, unique-ish slug from an article title.
 * A short random suffix guards against collisions between similar titles.
 * @param title - The article title.
 * @returns The generated slug.
 */
export function slugFromTitle(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = Math.random().toString(36).slice(2, 8);
  return base.length > 0 ? `${base}-${suffix}` : suffix;
}
