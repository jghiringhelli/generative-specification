export function generateSlug(title: string): string {
  const kebabCase = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const timestamp = Date.now().toString(36);
  
  return `${kebabCase}-${timestamp}`;
}

export function updateSlug(currentSlug: string, newTitle: string): string {
  const parts = currentSlug.split('-');
  const timestamp = parts[parts.length - 1];
  
  const kebabCase = newTitle
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${kebabCase}-${timestamp}`;
}
