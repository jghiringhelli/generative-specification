export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateUniqueSlug = async (
  title: string,
  prisma: any
): Promise<string> => {
  let slug = slugify(title);
  let count = 0;
  let uniqueSlug = slug;

  while (await prisma.article.findUnique({ where: { slug: uniqueSlug } })) {
    count++;
    uniqueSlug = `${slug}-${count}`;
  }

  return uniqueSlug;
};
