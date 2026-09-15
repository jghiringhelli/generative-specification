import slugify from 'slugify';
import { randomBytes } from 'crypto';

/**
 * Build a URL-safe slug from a title, appended with a short random suffix to
 * keep slugs unique even when titles collide.
 * @param title the article title to slugify.
 * @returns a lowercase, hyphenated, collision-resistant slug.
 */
export function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = randomBytes(4).toString('hex');
  return base ? `${base}-${suffix}` : suffix;
}
