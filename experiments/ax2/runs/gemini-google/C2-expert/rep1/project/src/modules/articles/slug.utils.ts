export function slugify(title: string, timestamp: number = Date.now()): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const slugBase = base.length > 0 ? base : 'article';
  return `${slugBase}-${timestamp}`;
}
